import { Injectable, NestMiddleware, Logger, Inject, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createSupabaseClient } from '../../config/supabase.config';

@Injectable()
export class CompanyContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CompanyContextMiddleware.name);
  private supabase = createSupabaseClient();

  constructor() {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Verificar si hay token de autenticación
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.replace('Bearer ', '');

      // Verificar el token
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data.user) {
        return next();
      }

      // Almacenar la información del usuario en la solicitud
      req['user'] = {
        id: data.user.id,
        email: data.user.email,
        // Aquí podrían incluirse otros datos del usuario
      };

      // Obtener ID de empresa del contexto (headers, params, query)
      let companyId = req.headers['x-company-id'] as string || 
                      req.params.companyId || 
                      req.query.companyId as string;

      // Si no hay companyId, intentar obtener la empresa activa del usuario
      if (!companyId) {
        // Primero buscar en user_active_company
        const { data: activeCompany, error: activeCompanyError } = await this.supabase
          .from('user_active_company')
          .select('company_id')
          .eq('user_id', data.user.id)
          .single();
          
        if (!activeCompanyError && activeCompany) {
          companyId = activeCompany.company_id;
          this.logger.debug(`Usando empresa activa ${companyId} para usuario ${data.user.id}`);
        } else {
          // Si no hay empresa activa configurada, obtener la primera compañía
          const { data: companies, error: companyError } = await this.supabase
            .from('company_user')
            .select('company_id, role, status')
            .eq('auth_id', data.user.id)
            .eq('status', 'ACTIVE')
            .limit(1);

          if (!companyError && companies && companies.length > 0) {
            companyId = companies[0].company_id;
            this.logger.debug(`Usando compañía predeterminada ${companyId} para usuario ${data.user.id}`);
            
            // Establecer esta compañía como activa para futuras solicitudes
            const { error: updateError } = await this.supabase
              .from('user_active_company')
              .upsert({
                user_id: data.user.id,
                company_id: companyId,
                updated_at: new Date().toISOString()
              });
              
            if (updateError) {
              this.logger.error(`Error al establecer compañía activa: ${updateError.message}`);
            } else {
              this.logger.debug(`Compañía activa actualizada a ${companyId} para usuario ${data.user.id}`);
            }
          }
        }
      }

      // Si hay companyId, obtener información del rol del usuario en esa compañía
      if (companyId) {
        // Obtener directamente del companyUser
        const { data: companyUserData, error: companyUserError } = await this.supabase
          .from('company_user')
          .select('role, status')
          .eq('auth_id', data.user.id)
          .eq('company_id', companyId)
          .single();

        if (!companyUserError && companyUserData && companyUserData.status === 'ACTIVE') {
          // Establecer contexto de empresa en la solicitud
          req['companyContext'] = {
            companyId,
            userRole: companyUserData.role,
            userId: data.user.id
          };
          
          this.logger.debug(`Contexto de empresa establecido: ${companyId} para usuario ${data.user.id} con rol ${companyUserData.role}`);
        }
      }

      next();
    } catch (error) {
      this.logger.error(`Error en middleware de contexto de empresa: ${error.message}`, error);
      next();
    }
  }
} 