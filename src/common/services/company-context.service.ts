import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createSupabaseClient } from '../../config/supabase.config';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ResourceType } from '../audit/audit.service';

interface ActiveCompanyData {
  companyId: string;
  userId: string;
  updatedAt: string;
}

@Injectable()
export class CompanyContextService {
  private readonly logger = new Logger(CompanyContextService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(
    private readonly auditService: AuditService
  ) {}

  /**
   * Establece la empresa activa para un usuario
   * @param userId - ID del usuario
   * @param companyId - ID de la empresa
   * @returns Promise<void>
   */
  async setActiveCompany(userId: string, companyId: string): Promise<void> {
    try {
      // Validar que el usuario pertenece a la empresa
      const { data: companyUser, error: userError } = await this.supabase
        .from('company_user')
        .select('*')
        .eq('auth_id', userId)
        .eq('company_id', companyId)
        .single();

      if (userError || !companyUser) {
        throw new ForbiddenException('El usuario no pertenece a esta empresa');
      }

      if (companyUser.status !== 'ACTIVE') {
        throw new ForbiddenException(`Usuario no activo en esta empresa (${companyUser.status})`);
      }

      const now = new Date().toISOString();

      // Verificar si ya existe un registro para este usuario
      const { data: existingData, error: existingError } = await this.supabase
        .from('user_active_company')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        // Si hay un error distinto a "no se encontraron resultados"
        throw new Error(`Error al verificar empresa activa: ${existingError.message}`);
      }

      let result;
      if (existingData) {
        // Actualizar registro existente
        const { error } = await this.supabase
          .from('user_active_company')
          .update({
            company_id: companyId,
            updated_at: now
          })
          .eq('user_id', userId);

        if (error) {
          throw new Error(`Error al actualizar empresa activa: ${error.message}`);
        }
      } else {
        // Crear nuevo registro
        const { error } = await this.supabase
          .from('user_active_company')
          .insert({
            user_id: userId,
            company_id: companyId,
            created_at: now,
            updated_at: now
          });

        if (error) {
          throw new Error(`Error al crear empresa activa: ${error.message}`);
        }
      }

      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.SET_ACTIVE_COMPANY,
        resourceType: ResourceType.USER,
        resourceId: userId,
        userId,
        metadata: {
          companyId,
          previousCompanyId: existingData?.company_id || null
        }
      });

      this.logger.debug(`Empresa activa establecida: ${companyId} para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`Error al establecer empresa activa: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene la empresa activa de un usuario
   * @param userId - ID del usuario
   * @returns Promise<string> - ID de la empresa activa
   */
  async getActiveCompany(userId: string): Promise<string> {
    try {
      // Verificar si existe un registro para este usuario
      const { data, error } = await this.supabase
        .from('user_active_company')
        .select('company_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si no hay registro, buscar la primera empresa a la que pertenece el usuario
        const { data: companies, error: companyError } = await this.supabase
          .from('company_user')
          .select('company_id')
          .eq('auth_id', userId)
          .eq('status', 'ACTIVE')
          .limit(1);

        if (companyError || !companies || companies.length === 0) {
          throw new NotFoundException('No se encontró ninguna empresa activa para el usuario');
        }

        // Establecer esta empresa como activa automáticamente
        const companyId = companies[0].company_id;
        await this.setActiveCompany(userId, companyId);
        return companyId;
      }

      return data.company_id;
    } catch (error) {
      this.logger.error(`Error al obtener empresa activa: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las empresas a las que pertenece un usuario
   * @param userId - ID del usuario
   * @returns Promise<Array<{id: string, name: string, role: string}>> - Lista de empresas
   */
  async getUserCompanies(userId: string): Promise<Array<{id: string, name: string, role: string}>> {
    try {
      const { data, error } = await this.supabase
        .from('company_user')
        .select(`
          company_id,
          role,
          company:companies(name)
        `)
        .eq('auth_id', userId)
        .eq('status', 'ACTIVE');

      if (error) {
        throw new Error(`Error al obtener empresas del usuario: ${error.message}`);
      }

      return data.map(item => ({
        id: item.company_id,
        name: (item.company as any)?.name || 'Desconocida',
        role: item.role
      }));
    } catch (error) {
      this.logger.error(`Error al obtener empresas del usuario: ${error.message}`, error);
      throw error;
    }
  }
} 