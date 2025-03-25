import { Injectable, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';
import { createSupabaseClient } from '../../config/supabase.config';

/**
 * Servicio centralizado para validación de permisos
 * Proporciona métodos para verificar diferentes tipos de permisos y accesos
 */
@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private supabase = createSupabaseClient();

  /**
   * Verifica si un usuario tiene acceso a una compañía específica
   * @param userId ID del usuario autenticado
   * @param companyId ID de la compañía
   * @returns true si el usuario tiene acceso, error en caso contrario
   */
  async validateCompanyAccess(userId: string, companyId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('company_user')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .eq('status', 'ACTIVE')
        .single();

      if (error || !data) {
        this.logger.warn(`Acceso denegado: usuario ${userId} no tiene acceso a compañía ${companyId}`);
        throw new ForbiddenException('No tienes permisos para acceder a esta compañía');
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validando acceso de compañía: ${error.message}`);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Error validando permisos de acceso a la compañía');
    }
  }

  /**
   * Verifica si un usuario es propietario de un recurso o tiene permisos administrativos
   * @param userId ID del usuario autenticado
   * @param resourceOwnerId ID del propietario del recurso
   * @param userRoles Roles del usuario
   * @returns true si el usuario es propietario o admin, error en caso contrario
   */
  validateResourceOwnership(userId: string, resourceOwnerId: string, userRoles: UserRole[]): boolean {
    // El propietario siempre tiene acceso a sus propios recursos
    if (userId === resourceOwnerId) {
      return true;
    }

    // Administradores y managers tienen acceso a todos los recursos
    if (userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.MANAGER)) {
      return true;
    }

    this.logger.warn(`Acceso denegado: usuario ${userId} intentó acceder a recurso de ${resourceOwnerId}`);
    throw new ForbiddenException('No tienes permisos para acceder a este recurso');
  }

  /**
   * Verifica si un recurso existe en una compañía
   * @param resourceId ID del recurso
   * @param companyId ID de la compañía
   * @param tableName Nombre de la tabla
   * @returns true si el recurso existe, error en caso contrario
   */
  async validateResourceExists(resourceId: string, companyId: string, tableName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('id')
        .eq('id', resourceId)
        .eq('company_id', companyId)
        .single();

      if (error || !data) {
        this.logger.warn(`Recurso no encontrado: ${tableName} ${resourceId} en compañía ${companyId}`);
        throw new NotFoundException(`${tableName} no encontrado o no pertenece a la compañía especificada`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validando existencia de recurso: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Error validando existencia del recurso`);
    }
  }

  /**
   * Verifica si un usuario tiene un rol específico
   * @param userRoles Roles del usuario
   * @param requiredRole Rol requerido
   * @returns true si el usuario tiene el rol requerido, error en caso contrario
   */
  validateRole(userRoles: UserRole[], requiredRole: UserRole): boolean {
    if (userRoles.includes(requiredRole) || userRoles.includes(UserRole.ADMIN)) {
      return true;
    }

    this.logger.warn(`Acceso denegado: se requiere rol ${requiredRole}`);
    throw new ForbiddenException(`Se requiere rol ${requiredRole} para esta operación`);
  }

  /**
   * Valida permisos para una operación específica en el contexto de una compañía
   * @param userId ID del usuario
   * @param companyId ID de la compañía
   * @param requiredRoles Roles requeridos para la operación
   * @returns true si el usuario tiene permisos, error en caso contrario
   */
  async validateCompanyOperation(
    userId: string, 
    companyId: string, 
    requiredRoles: UserRole[]
  ): Promise<boolean> {
    try {
      // Primero verificar que el usuario tiene acceso a la compañía
      await this.validateCompanyAccess(userId, companyId);
      
      // Luego verificar que tiene el rol adecuado
      const { data, error } = await this.supabase
        .from('company_user')
        .select('role')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .eq('status', 'ACTIVE')
        .single();
        
      if (error || !data) {
        throw new ForbiddenException('No se pudieron verificar los roles del usuario');
      }
      
      if (!requiredRoles.includes(data.role as UserRole) && data.role !== UserRole.ADMIN) {
        this.logger.warn(
          `Acceso denegado: usuario ${userId} con rol ${data.role} intentó realizar operación ` +
          `que requiere roles [${requiredRoles.join(', ')}] en compañía ${companyId}`
        );
        throw new ForbiddenException('No tienes el rol requerido para esta operación');
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error validando operación de compañía: ${error.message}`);
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new ForbiddenException('Error validando permisos para la operación');
    }
  }
} 