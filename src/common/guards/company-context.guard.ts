import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { COMPANY_CONTEXT_KEY, SKIP_COMPANY_CONTEXT_KEY, CompanyContextOptions } from '../decorators/company-context.decorator';
import { createSupabaseClient } from '../../config/supabase.config';
import { CompanyContext, RequestWithCompanyContext } from '../interfaces/company-context.interface';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  private readonly logger = new Logger(CompanyContextGuard.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si el endpoint debe omitir la validación
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_COMPANY_CONTEXT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (skipCheck) {
      return true;
    }

    // Obtener opciones configuradas en el decorador
    const options = this.reflector.getAllAndOverride<CompanyContextOptions>(
      COMPANY_CONTEXT_KEY,
      [context.getHandler(), context.getClass()]
    ) || {};

    const request = context.switchToHttp().getRequest<RequestWithCompanyContext>();
    const { user } = request;
    
    // Si no hay usuario autenticado, no puede acceder
    if (!user) {
      throw new UnauthorizedException('Se requiere autenticación para acceder a este recurso');
    }

    // Obtener ID de compañía de diferentes fuentes
    const companyIdInPath = request.params.companyId;
    const companyIdInHeader = request.headers['x-company-id'] as string;
    const companyIdInQuery = request.query.companyId as string;
    
    let companyId = companyIdInPath || companyIdInHeader || companyIdInQuery;
    
    // Si se requiere en parámetros y no está presente, rechazar
    if (options.requireInParams && !companyIdInPath) {
      this.logger.warn(`Acceso denegado: ID de compañía requerido en parámetros para ${request.method} ${request.path}`);
      throw new ForbiddenException('Se requiere ID de compañía en la ruta para acceder a este recurso');
    }

    // Si no hay ID de compañía en ninguna parte, intentar obtener la activa
    if (!companyId) {
      try {
        const { data: activeCompany, error } = await this.supabase
          .from('user_active_company')
          .select('company_id')
          .eq('user_id', user.id)
          .single();
        
        if (error || !activeCompany) {
          this.logger.warn(`No se encontró empresa activa para el usuario ${user.id}`);
          throw new ForbiddenException('No tiene una empresa activa configurada');
        }
        
        companyId = activeCompany.company_id;
      } catch (error) {
        this.logger.error(`Error al verificar empresa activa: ${error.message}`);
        throw new ForbiddenException('No tiene acceso a ninguna empresa o se produjo un error');
      }
    }

    // Validar que el usuario pertenece a la compañía
    try {
      const { data: companyUser, error } = await this.supabase
        .from('company_user')
        .select('role, status')
        .eq('auth_id', user.id)
        .eq('company_id', companyId)
        .eq('status', 'ACTIVE')
        .single();
      
      if (error || !companyUser) {
        this.logger.warn(`Usuario ${user.id} no tiene acceso activo a la empresa ${companyId}`);
        throw new ForbiddenException('No tiene acceso a esta empresa');
      }
      
      // Verificar roles requeridos si se especificaron
      if (options.requireRoles && options.requireRoles.length > 0) {
        const hasRequiredRole = options.requireRoles.some(role => 
          role.toLowerCase() === companyUser.role.toLowerCase()
        );
        
        if (!hasRequiredRole) {
          this.logger.warn(
            `Usuario ${user.id} con rol ${companyUser.role} no cumple con los roles requeridos [${options.requireRoles.join(', ')}]`
          );
          throw new ForbiddenException('No tiene los permisos necesarios para acceder a este recurso');
        }
      }
      
      // Establecer el contexto de empresa en la solicitud
      const companyContext: CompanyContext = {
        companyId,
        userRole: companyUser.role,
        userId: user.id
      };
      request.companyContext = companyContext;
      
      return true;
    } catch (error) {
      // Si ya es una excepción de NestJS, propagarla
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Error al validar acceso a empresa: ${error.message}`);
      throw new ForbiddenException('Error al validar acceso a empresa');
    }
  }
} 