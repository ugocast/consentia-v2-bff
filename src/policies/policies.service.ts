import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { CreatePolicyDto, UpdatePolicyDto, PolicyDto, PolicyStatus } from './dto';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

  /**
   * Obtiene todas las políticas activas
   * @param companyId - ID de la compañía para filtrar políticas
   * @returns Lista de políticas
   * @throws Error si hay un problema al obtener las políticas
   */
  async findAll(companyId?: string): Promise<PolicyDto[]> {
    try {
      let query = this.supabase
        .from('legal_policy')
        .select('*')
        .is('valid_to', null);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error(
          `Error al obtener políticas: ${error.message}`,
          error,
        );
        throw new Error(`Error al obtener políticas: ${error.message}`);
      }

      return data.map(policy => this.transformToCamelCase(policy));
    } catch (error) {
      this.logger.error('Error al obtener políticas', error);
      throw error;
    }
  }

  /**
   * Crea una nueva política
   * @param createPolicyDto - DTO con los datos para crear la política
   * @param userId - ID del usuario que crea la política
   * @returns Política creada
   * @throws Error si hay un problema al crear la política
   */
  async create(
    createPolicyDto: CreatePolicyDto,
    userId: string,
  ): Promise<PolicyDto> {
    try {
      const { data, error } = await this.supabase
        .from('legal_policy')
        .insert({
          title: createPolicyDto.title,
          content: createPolicyDto.content,
          company_id: createPolicyDto.companyId,
          valid_from: new Date().toISOString(),
          data_types: createPolicyDto.dataTypes,
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error al crear política: ${error.message}`, error);
        throw new Error(`Error al crear política: ${error.message}`);
      }

      await this.auditService.log({
        action: AuditAction.CREATE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: data.id,
        userId,
        metadata: {
          title: createPolicyDto.title,
          companyId: createPolicyDto.companyId,
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error('Error al crear política', error);
      throw error;
    }
  }

  /**
   * Obtiene una política por su ID
   * @param id - ID de la política
   * @returns Política encontrada
   * @throws NotFoundException si la política no existe
   * @throws Error si hay un problema al obtener la política
   */
  async findOne(id: string): Promise<PolicyDto> {
    try {
      const { data, error } = await this.supabase
        .from('legal_policy')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logger.error(`Política no encontrada: ${error?.message}`);
        throw new NotFoundException('Política no encontrada');
      }

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error al obtener política: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza una política (crea una nueva versión)
   * @param id - ID de la política
   * @param updatePolicyDto - DTO con los datos para actualizar la política
   * @param userId - ID del usuario que actualiza la política
   * @returns Nueva versión de la política
   * @throws NotFoundException si la política no existe
   * @throws Error si hay un problema al actualizar la política
   */
  async update(
    id: string,
    updatePolicyDto: UpdatePolicyDto,
    userId: string,
  ): Promise<PolicyDto> {
    try {
      const current = await this.findOne(id);

      const { data, error } = await this.supabase
        .from('legal_policy')
        .insert({
          title: updatePolicyDto.title,
          content: updatePolicyDto.content,
          previous_version_id: id,
          company_id: current.companyId,
          valid_from: new Date().toISOString(),
          data_types: updatePolicyDto.dataTypes,
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(
          `Error al crear nueva versión de la política: ${error.message}`,
          error,
        );
        throw new Error('Error al crear nueva versión de la política');
      }

      // Actualizar la fecha de validez de la versión anterior
      const { error: updateError } = await this.supabase
        .from('legal_policy')
        .update({ valid_to: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        this.logger.error(
          `Error al actualizar versión anterior: ${updateError.message}`,
          updateError,
        );
      }

      await this.auditService.log({
        action: AuditAction.UPDATE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: data.id,
        userId,
        previousResourceId: id,
        metadata: {
          title: updatePolicyDto.title,
          companyId: current.companyId,
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(
        `Error al actualizar política: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene todas las versiones de una política
   * @param id - ID de la política
   * @returns Lista de versiones de la política
   * @throws NotFoundException si la política no existe
   * @throws Error si hay un problema al obtener las versiones
   */
  async findVersions(id: string): Promise<PolicyDto[]> {
    try {
      const current = await this.findOne(id);

      const { data, error } = await this.supabase
        .from('legal_policy')
        .select('*')
        .or(`id.eq.${id},previous_version_id.eq.${id}`)
        .order('valid_from', { ascending: false });

      if (error) {
        this.logger.error(
          `Error al obtener versiones: ${error.message}`,
          error,
        );
        throw new Error(`Error al obtener versiones: ${error.message}`);
      }

      return data.map(policy => this.transformToCamelCase(policy));
    } catch (error) {
      this.logger.error(`Error al obtener versiones: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Elimina una política (soft delete)
   * @param id - ID de la política
   * @param userId - ID del usuario que elimina la política
   * @throws NotFoundException si la política no existe
   * @throws Error si hay un problema al eliminar la política
   */
  async remove(id: string, userId: string): Promise<void> {
    try {
      const current = await this.findOne(id);

      const { error: updateError } = await this.supabase
        .from('legal_policy')
        .update({ valid_to: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        this.logger.error(
          `Error al eliminar política: ${updateError.message}`,
          updateError,
        );
        throw new Error(`Error al eliminar política: ${updateError.message}`);
      }

      await this.auditService.log({
        action: AuditAction.DELETE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: id,
        userId,
        metadata: {
          title: current.title,
          companyId: current.companyId,
        },
      });
    } catch (error) {
      this.logger.error(`Error al eliminar política: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial completo de versiones de una política
   * @param id - ID de la política
   * @returns Lista de versiones de la política ordenadas cronológicamente
   * @throws NotFoundException si la política no existe
   * @throws Error si hay un problema al obtener el historial
   */
  async getVersionHistory(id: string): Promise<PolicyDto[]> {
    try {
      const current = await this.findOne(id);

      // Encontrar la versión más antigua (la que no tiene previous_version_id)
      let rootPolicy = current;
      let previousVersionId = current.previousVersionId;

      // Si la política actual tiene una versión anterior, buscar la raíz
      if (previousVersionId) {
        while (previousVersionId) {
          const { data, error } = await this.supabase
            .from('legal_policy')
            .select('*')
            .eq('id', previousVersionId)
            .single();

          if (error || !data) {
            break;
          }

          rootPolicy = this.transformToCamelCase(data);
          previousVersionId = rootPolicy.previousVersionId;
        }
      }

      // Obtener todas las versiones a partir de la raíz
      const versions: PolicyDto[] = [];
      let currentId = rootPolicy.id;
      let hasNext = true;

      while (hasNext) {
        const { data, error } = await this.supabase
          .from('legal_policy')
          .select('*')
          .eq('id', currentId)
          .single();

        if (error || !data) {
          break;
        }

        versions.push(this.transformToCamelCase(data));

        // Buscar la siguiente versión (la que tiene esta como previous_version_id)
        const { data: nextVersions, error: nextError } = await this.supabase
          .from('legal_policy')
          .select('*')
          .eq('previous_version_id', currentId);

        if (nextError || !nextVersions || nextVersions.length === 0) {
          hasNext = false;
        } else {
          currentId = nextVersions[0].id;
        }
      }

      return versions;
    } catch (error) {
      this.logger.error(`Error al obtener historial de versiones: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una política
   * @param id - ID de la política
   * @param status - Nuevo estado
   * @param userId - ID del usuario que realiza el cambio
   * @returns Política actualizada
   * @throws NotFoundException si la política no existe
   * @throws BadRequestException si la transición de estado no es válida
   * @throws Error si hay un problema al actualizar el estado
   */
  async updateStatus(
    id: string,
    status: PolicyStatus,
    userId: string,
  ): Promise<PolicyDto> {
    try {
      // Verificar que la política existe
      const policy = await this.findOne(id);
      
      // Si la política no tiene un estado, asumimos que está en borrador
      const currentStatus = policy.status || PolicyStatus.DRAFT;
      
      // Verificar que la transición de estado es válida
      if (!this.isValidStatusTransition(currentStatus, status)) {
        this.logger.warn(`Transición de estado inválida: ${currentStatus} -> ${status}`);
        throw new BadRequestException(`Transición de estado inválida: ${currentStatus} -> ${status}`);
      }

      // Actualizar el estado
      const { data, error } = await this.supabase
        .from('legal_policy')
        .update({ 
          status: status,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(
          `Error al actualizar estado de política: ${error.message}`,
          error,
        );
        throw new Error(`Error al actualizar estado de política: ${error.message}`);
      }

      // Registrar el cambio en auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE_POLICY,  // Usamos UPDATE_POLICY en lugar de UPDATE_POLICY_STATUS
        resourceType: ResourceType.POLICY_STATUS,
        resourceId: id,
        userId,
        metadata: {
          previousStatus: currentStatus,
          currentStatus: status,
          title: policy.title
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(
        `Error al actualizar estado de política: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Verifica si una transición de estado es válida
   * @param currentStatus - Estado actual
   * @param newStatus - Nuevo estado
   * @returns true si la transición es válida, false en caso contrario
   * @private
   */
  private isValidStatusTransition(currentStatus: PolicyStatus, newStatus: PolicyStatus): boolean {
    // Si los estados son iguales, no es una transición
    if (currentStatus === newStatus) {
      return false;
    }

    // Definir las transiciones permitidas
    const allowedTransitions: Record<PolicyStatus, PolicyStatus[]> = {
      [PolicyStatus.DRAFT]: [PolicyStatus.ACTIVE, PolicyStatus.DELETED],
      [PolicyStatus.ACTIVE]: [PolicyStatus.INACTIVE, PolicyStatus.ARCHIVED],
      [PolicyStatus.INACTIVE]: [PolicyStatus.ACTIVE, PolicyStatus.ARCHIVED],
      [PolicyStatus.ARCHIVED]: [PolicyStatus.DELETED],
      [PolicyStatus.DELETED]: []
    };

    // Verificar si la transición está permitida
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Transforma un objeto de snake_case a camelCase
   * @param data - Objeto a transformar
   * @returns Objeto transformado
   * @private
   */
  private transformToCamelCase(data: any): PolicyDto {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      companyId: data.company_id,
      previousVersionId: data.previous_version_id,
      validFrom: data.valid_from,
      validTo: data.valid_to,
      dataTypes: data.data_types,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      version: data.version,
      status: data.status,
      createdBy: data.created_by,
    };
  }
}
