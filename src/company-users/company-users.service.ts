import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ForbiddenException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  CompanyUserDto,
  CreateCompanyUserDto,
  UpdateCompanyUserDto,
  CompanyUserStatus,
  CompanyUserRole,
  ChangeUserStatusDto,
  ChangeUserRoleDto,
  UserActivityDto,
  ActivityEntryDto
} from './dto';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';

/**
 * Servicio que gestiona los usuarios de compañía
 */
@Injectable()
export class CompanyUsersService {
  private readonly logger = new Logger(CompanyUsersService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(
    private readonly auditService: AuditService,
  ) {}

  /**
   * Crea un nuevo usuario de compañía
   * @param companyId - ID de la compañía
   * @param createCompanyUserDto - DTO con los datos para crear el usuario
   * @param adminUserId - ID del usuario administrador que crea el usuario
   * @returns Usuario de compañía creado
   * @throws Error si hay un problema al crear el usuario
   */
  async create(
    companyId: string, 
    createCompanyUserDto: CreateCompanyUserDto, 
    adminUserId: string
  ): Promise<CompanyUserDto> {
    try {
      // Validar existencia de la compañía
      await this.validateCompanyExists(companyId);
      
      // Validar que el usuario administrador pertenece a la compañía
      await this.validateUserBelongsToCompany(adminUserId, companyId);
      
      // Validar que no existe otro usuario con el mismo email en la compañía
      await this.validateEmailUniqueness(createCompanyUserDto.email, companyId);
      
      // Validar que no existe otro usuario con el mismo authId
      await this.validateAuthIdUniqueness(createCompanyUserDto.authId);
      
      // Preparar datos para inserción
      const status = createCompanyUserDto.status || CompanyUserStatus.INACTIVE;
      const now = new Date().toISOString();
      
      const userData = {
        ...createCompanyUserDto,
        company_id: companyId,
        status,
        created_at: now,
        updated_at: now,
        created_by: adminUserId
      };
      
      // Insertar en base de datos
      const { data, error } = await this.supabase
        .from('company_user')
        .insert(userData)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating company user: ${error.message}`, error);
        throw new BadRequestException(`Error creating company user: ${error.message}`);
      }

      // Transformar resultado a DTO
      const userDto = this.transformToCamelCase(data);

      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.CREATE_COMPANY_USER,
        resourceType: ResourceType.COMPANY_USER,
        resourceId: userDto.id,
        userId: adminUserId,
        metadata: {
          fullName: userDto.fullName,
          email: userDto.email,
          role: userDto.role,
          companyId,
        },
      });

      return userDto;
    } catch (error) {
      this.logger.error(`Error creating company user: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios de una compañía
   * @param companyId - ID de la compañía
   * @param includeDeleted - Si se deben incluir usuarios eliminados (DELETED)
   * @returns Lista de usuarios de compañía
   * @throws Error si hay un problema al obtener los usuarios
   */
  async findAll(companyId: string, includeDeleted = false): Promise<CompanyUserDto[]> {
    try {
      // Validar existencia de la compañía
      await this.validateCompanyExists(companyId);
      
      // Preparar query
      let query = this.supabase
        .from('company_user')
        .select('*')
        .eq('company_id', companyId);
        
      // Filtrar usuarios eliminados si no se solicitan
      if (!includeDeleted) {
        query = query.neq('status', CompanyUserStatus.DELETED);
      }
      
      // Ordenar por nombre y fecha de creación
      query = query.order('full_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.logger.error(`Error fetching company users: ${error.message}`, error);
        throw new BadRequestException(`Error fetching company users: ${error.message}`);
      }

      return data.map(item => this.transformToCamelCase(item));
    } catch (error) {
      this.logger.error(`Error fetching company users: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario de compañía por su ID
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param includeDeleted - Si se debe permitir obtener usuarios eliminados
   * @returns Usuario de compañía encontrado
   * @throws NotFoundException si el usuario no existe
   * @throws Error si hay un problema al obtener el usuario
   */
  async findOne(companyId: string, id: string, includeDeleted = false): Promise<CompanyUserDto> {
    try {
      // Validar existencia de la compañía
      await this.validateCompanyExists(companyId);
      
      // Preparar query
      let query = this.supabase
        .from('company_user')
        .select('*')
        .eq('company_id', companyId)
        .eq('company_user_id', id);
      
      // No incluir eliminados a menos que se especifique
      if (!includeDeleted) {
        query = query.neq('status', CompanyUserStatus.DELETED);
      }
      
      const { data, error } = await query.single();

      if (error || !data) {
        this.logger.error(`Company user with ID ${id} not found or inaccessible`);
        throw new NotFoundException(`Company user with ID ${id} not found or inaccessible`);
      }

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error fetching company user: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario de compañía
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param updateCompanyUserDto - DTO con los datos para actualizar el usuario
   * @param adminUserId - ID del usuario administrador que actualiza el usuario
   * @returns Usuario de compañía actualizado
   * @throws NotFoundException si el usuario no existe
   * @throws Error si hay un problema al actualizar el usuario
   */
  async update(
    companyId: string,
    id: string,
    updateCompanyUserDto: UpdateCompanyUserDto,
    adminUserId: string,
  ): Promise<CompanyUserDto> {
    try {
      // Obtener usuario actual
      const currentUser = await this.findOne(companyId, id);
      
      // Validar que el administrador tiene permisos
      await this.validateUserBelongsToCompany(adminUserId, companyId);
      
      // Validar que el estado del usuario permite actualización
      if (currentUser.status === CompanyUserStatus.DELETED) {
        throw new ForbiddenException('Cannot update a deleted user');
      }
      
      // Si se cambia el email, validar unicidad
      if (updateCompanyUserDto.email && updateCompanyUserDto.email !== currentUser.email) {
        await this.validateEmailUniqueness(updateCompanyUserDto.email, companyId, id);
      }
      
      // Preparar datos para actualización
      const updateData = {
        ...this.transformToSnakeCase(updateCompanyUserDto),
        updated_at: new Date().toISOString(),
        updated_by: adminUserId
      };
      
      // Actualizar en base de datos
      const { data, error } = await this.supabase
        .from('company_user')
        .update(updateData)
        .eq('company_id', companyId)
        .eq('company_user_id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating company user: ${error.message}`, error);
        throw new BadRequestException(`Error updating company user: ${error.message}`);
      }

      // Transformar resultado a DTO
      const updatedUser = this.transformToCamelCase(data);

      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE_COMPANY_USER,
        resourceType: ResourceType.COMPANY_USER,
        resourceId: updatedUser.id,
        userId: adminUserId,
        metadata: {
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          role: updatedUser.role,
          previousData: {
            fullName: currentUser.fullName,
            email: currentUser.email,
            role: currentUser.role
          },
          companyId,
        },
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating company user: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Cambia el estado de un usuario de compañía
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param changeStatusDto - DTO con el nuevo estado y razón
   * @param adminUserId - ID del usuario administrador que cambia el estado
   * @returns Usuario de compañía con estado actualizado
   * @throws Error si hay un problema al cambiar el estado
   */
  async changeStatus(
    companyId: string,
    id: string,
    changeStatusDto: ChangeUserStatusDto,
    adminUserId: string,
  ): Promise<CompanyUserDto> {
    try {
      // Obtener usuario actual
      const currentUser = await this.findOne(companyId, id, true);
      
      // Validar que el administrador tiene permisos
      await this.validateUserBelongsToCompany(adminUserId, companyId);
      
      // Validar transición de estado
      this.validateStatusTransition(currentUser.status, changeStatusDto.status);
      
      // Preparar datos para actualización
      const updateData = {
        status: changeStatusDto.status,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId
      };
      
      // Actualizar en base de datos
      const { data, error } = await this.supabase
        .from('company_user')
        .update(updateData)
        .eq('company_id', companyId)
        .eq('company_user_id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error changing user status: ${error.message}`, error);
        throw new BadRequestException(`Error changing user status: ${error.message}`);
      }

      // Transformar resultado a DTO
      const updatedUser = this.transformToCamelCase(data);

      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.CHANGE_USER_STATUS,
        resourceType: ResourceType.COMPANY_USER,
        resourceId: updatedUser.id,
        userId: adminUserId,
        metadata: {
          previousStatus: currentUser.status,
          newStatus: updatedUser.status,
          reason: changeStatusDto.reason,
          companyId,
        },
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error changing user status: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Cambia el rol de un usuario de compañía
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param changeRoleDto - DTO con el nuevo rol y justificación
   * @param adminUserId - ID del usuario administrador que cambia el rol
   * @returns Usuario de compañía con rol actualizado
   * @throws Error si hay un problema al cambiar el rol
   */
  async changeRole(
    companyId: string,
    id: string,
    changeRoleDto: ChangeUserRoleDto,
    adminUserId: string,
  ): Promise<CompanyUserDto> {
    try {
      // Obtener usuario actual
      const currentUser = await this.findOne(companyId, id);
      
      // Validar que el administrador tiene permisos
      await this.validateAdminPermissions(adminUserId, companyId);
      
      // Validar que el estado permite cambio de rol
      if (currentUser.status !== CompanyUserStatus.ACTIVE) {
        throw new ForbiddenException('Only active users can have their role changed');
      }
      
      // Preparar datos para actualización
      const updateData = {
        role: changeRoleDto.role,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId
      };
      
      // Actualizar en base de datos
      const { data, error } = await this.supabase
        .from('company_user')
        .update(updateData)
        .eq('company_id', companyId)
        .eq('company_user_id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error changing user role: ${error.message}`, error);
        throw new BadRequestException(`Error changing user role: ${error.message}`);
      }

      // Transformar resultado a DTO
      const updatedUser = this.transformToCamelCase(data);

      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.CHANGE_USER_ROLE,
        resourceType: ResourceType.COMPANY_USER,
        resourceId: updatedUser.id,
        userId: adminUserId,
        metadata: {
          previousRole: currentUser.role,
          newRole: updatedUser.role,
          justification: changeRoleDto.justification,
          companyId,
        },
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error changing user role: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Elimina un usuario de compañía (cambia su estado a DELETED)
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param adminUserId - ID del usuario administrador que elimina el usuario
   * @returns Usuario de compañía con estado actualizado a DELETED
   * @throws NotFoundException si el usuario no existe
   * @throws Error si hay un problema al eliminar el usuario
   */
  async remove(companyId: string, id: string, adminUserId: string): Promise<CompanyUserDto> {
    try {
      // Obtener usuario actual
      const currentUser = await this.findOne(companyId, id, true);
      
      // Validar que el administrador tiene permisos
      await this.validateAdminPermissions(adminUserId, companyId);
      
      // Verificar que no está ya eliminado
      if (currentUser.status === CompanyUserStatus.DELETED) {
        throw new ForbiddenException('User is already deleted');
      }
      
      // Cambiar estado a DELETED
      const updatedUser = await this.changeStatus(
        companyId, 
        id, 
        { status: CompanyUserStatus.DELETED, reason: 'User deleted by administrator' }, 
        adminUserId
      );
      
      // Registrar en auditoría la acción de eliminar
      await this.auditService.log({
        action: AuditAction.DELETE_COMPANY_USER,
        resourceType: ResourceType.COMPANY_USER,
        resourceId: id,
        userId: adminUserId,
        metadata: {
          fullName: currentUser.fullName,
          email: currentUser.email,
          companyId,
        },
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error removing company user: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de actividad de un usuario
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param limit - Número máximo de registros a devolver
   * @returns Historial de actividad del usuario
   * @throws Error si hay un problema al obtener el historial
   */
  async getUserActivity(companyId: string, id: string, limit = 50): Promise<UserActivityDto> {
    try {
      // Verificar que el usuario existe
      const user = await this.findOne(companyId, id, true);
      
      // Obtener actividad desde la tabla de auditoría
      const { data, error } = await this.supabase
        .from('audit_log')
        .select('*')
        .eq('resource_id', id)
        .eq('resource_type', ResourceType.COMPANY_USER)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        this.logger.error(`Error fetching user activity: ${error.message}`, error);
        throw new BadRequestException(`Error fetching user activity: ${error.message}`);
      }
      
      // Transformar datos a formato DTO
      const activities: ActivityEntryDto[] = data.map(log => ({
        activityType: log.action,
        timestamp: log.created_at,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        metadata: log.metadata
      }));
      
      return {
        userId: id,
        activities
      };
    } catch (error) {
      this.logger.error(`Error fetching user activity: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del propio usuario
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param updateDto - DTO con los datos para actualizar el perfil
   * @returns Usuario de compañía actualizado
   * @throws Error si hay un problema al actualizar el perfil
   */
  async updateSelfProfile(
    companyId: string,
    id: string,
    updateDto: UpdateCompanyUserDto,
  ): Promise<CompanyUserDto> {
    // Validar campos permitidos para autoactualización
    this.validateSelfUpdateFields(updateDto);
    
    // Actualizar perfil (reutilizando método update)
    return this.update(companyId, id, updateDto, id);
  }

  /**
   * Valida que el usuario pertenece a la compañía y tiene rol de administrador
   * @param userId - ID del usuario
   * @param companyId - ID de la compañía
   * @private
   */
  private async validateAdminPermissions(userId: string, companyId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('company_user')
      .select('role, status')
      .eq('company_user_id', userId)
      .eq('company_id', companyId)
      .single();
    
    if (error || !data) {
      throw new ForbiddenException('User does not belong to the specified company');
    }
    
    if (data.status !== CompanyUserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }
    
    if (data.role !== CompanyUserRole.ADMIN) {
      throw new ForbiddenException('User does not have admin permissions');
    }
  }

  /**
   * Valida que el usuario pertenece a la compañía
   * @param userId - ID del usuario
   * @param companyId - ID de la compañía
   * @private
   */
  private async validateUserBelongsToCompany(userId: string, companyId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('company_user')
      .select('company_user_id')
      .eq('company_user_id', userId)
      .eq('company_id', companyId)
      .single();
    
    if (error || !data) {
      throw new ForbiddenException('User does not belong to the specified company');
    }
  }

  /**
   * Valida que la compañía existe
   * @param companyId - ID de la compañía
   * @private
   */
  private async validateCompanyExists(companyId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('company')
      .select('company_id')
      .eq('company_id', companyId)
      .single();
    
    if (error || !data) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }
  }

  /**
   * Valida que el email no existe en la compañía
   * @param email - Email a validar
   * @param companyId - ID de la compañía
   * @param excludeUserId - ID de usuario a excluir (para actualización)
   * @private
   */
  private async validateEmailUniqueness(
    email: string, 
    companyId: string, 
    excludeUserId?: string
  ): Promise<void> {
    let query = this.supabase
      .from('company_user')
      .select('company_user_id')
      .eq('email', email)
      .eq('company_id', companyId);
    
    if (excludeUserId) {
      query = query.neq('company_user_id', excludeUserId);
    }
    
    const { data, error } = await query;
    
    if (!error && data && data.length > 0) {
      throw new ConflictException(`Email ${email} is already in use in this company`);
    }
  }

  /**
   * Valida que el authId no existe
   * @param authId - AuthId a validar
   * @private
   */
  private async validateAuthIdUniqueness(authId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('company_user')
      .select('company_user_id')
      .eq('auth_id', authId);
    
    if (!error && data && data.length > 0) {
      throw new ConflictException(`Auth ID ${authId} is already in use`);
    }
  }

  /**
   * Valida que la transición de estado es permitida
   * @param currentStatus - Estado actual
   * @param newStatus - Nuevo estado
   * @private
   */
  private validateStatusTransition(currentStatus: CompanyUserStatus, newStatus: CompanyUserStatus): void {
    // Definir transiciones permitidas
    const allowedTransitions: Record<CompanyUserStatus, CompanyUserStatus[]> = {
      [CompanyUserStatus.INACTIVE]: [CompanyUserStatus.ACTIVE, CompanyUserStatus.DELETED],
      [CompanyUserStatus.ACTIVE]: [CompanyUserStatus.INACTIVE, CompanyUserStatus.SUSPENDED, CompanyUserStatus.DELETED],
      [CompanyUserStatus.SUSPENDED]: [CompanyUserStatus.ACTIVE, CompanyUserStatus.DELETED],
      [CompanyUserStatus.DELETED]: [], // Estado terminal, no permite transiciones
    };
    
    // Verificar si la transición es válida
    if (!allowedTransitions[currentStatus].includes(newStatus) && currentStatus !== newStatus) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Valida que los campos son permitidos para auto-actualización
   * @param updateDto - DTO de actualización
   * @private
   */
  private validateSelfUpdateFields(updateDto: UpdateCompanyUserDto): void {
    // Campos permitidos para auto-actualización
    const allowedFields = ['fullName', 'metadata'];
    
    // Verificar que solo se están actualizando campos permitidos
    const providedFields = Object.keys(updateDto);
    const illegalFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (illegalFields.length > 0) {
      throw new ForbiddenException(
        `Cannot update the following fields in self-update: ${illegalFields.join(', ')}`
      );
    }
  }

  /**
   * Transforma un objeto de snake_case a camelCase
   * @param data - Objeto a transformar
   * @returns Objeto transformado
   * @private
   */
  private transformToCamelCase(data: any): CompanyUserDto {
    return {
      id: data.company_user_id,
      companyId: data.company_id,
      authId: data.auth_id,
      fullName: data.full_name,
      email: data.email,
      role: data.role,
      status: data.status,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Transforma un objeto de camelCase a snake_case
   * @param data - Objeto a transformar
   * @returns Objeto transformado
   * @private
   */
  private transformToSnakeCase(data: any): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (data.fullName !== undefined) result.full_name = data.fullName;
    if (data.email !== undefined) result.email = data.email;
    if (data.authId !== undefined) result.auth_id = data.authId;
    if (data.role !== undefined) result.role = data.role;
    if (data.status !== undefined) result.status = data.status;
    if (data.metadata !== undefined) result.metadata = data.metadata;
    
    return result;
  }

  /**
   * Obtiene la actividad de un usuario de compañía
   * @param companyId - ID de la compañía
   * @param id - ID del usuario de compañía
   * @param requestUserId - ID del usuario que solicita la información
   * @returns Historial de actividad del usuario
   * @throws NotFoundException si el usuario no existe
   * @throws ForbiddenException si el solicitante no tiene permisos
   */
  async getActivity(companyId: string, id: string, requestUserId: string): Promise<UserActivityDto> {
    try {
      // Verificar que el usuario existe
      await this.findOne(companyId, id, true);
      
      // Verificar que el solicitante tiene permisos
      await this.validateUserBelongsToCompany(requestUserId, companyId);
      
      // Obtener actividad del usuario (reusamos el método existente pero eliminamos el limit)
      return this.getUserActivity(companyId, id);
    } catch (error) {
      this.logger.error(`Error fetching user activity: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario de compañía por su ID de autenticación y compañía
   * @param authId - ID de autenticación del usuario
   * @param companyId - ID de la compañía
   * @param includeInactive - Si se deben incluir usuarios inactivos
   * @returns Usuario de compañía encontrado o null si no existe
   */
  async findByUserAndCompany(
    authId: string,
    companyId: string,
    includeInactive = false
  ): Promise<CompanyUserDto | null> {
    try {
      // Preparar query
      let query = this.supabase
        .from('company_user')
        .select('*')
        .eq('auth_id', authId)
        .eq('company_id', companyId);
      
      // Si no se incluyen inactivos, filtrar solo activos
      if (!includeInactive) {
        query = query.eq('status', CompanyUserStatus.ACTIVE);
      } else {
        // Si se incluyen inactivos, al menos excluir los eliminados
        query = query.neq('status', CompanyUserStatus.DELETED);
      }
      
      const { data, error } = await query.single();

      if (error || !data) {
        this.logger.debug(`User with auth ID ${authId} not found in company ${companyId}`);
        return null;
      }

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error fetching company user by auth ID: ${error.message}`, error);
      return null;
    }
  }
  
  /**
   * Valida que el usuario existe en la compañía por su ID de autenticación
   * @param authId - ID de autenticación del usuario
   * @param companyId - ID de la compañía
   * @returns Promise<boolean> - true si el usuario existe en la compañía
   */
  async validateUserBelongsToCompanyByAuthId(authId: string, companyId: string): Promise<boolean> {
    const user = await this.findByUserAndCompany(authId, companyId, true);
    return user !== null;
  }
}
