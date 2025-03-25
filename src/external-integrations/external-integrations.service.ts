import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  ExternalIntegrationDto,
  CreateExternalIntegrationDto,
  UpdateExternalIntegrationDto,
  ExternalIntegrationStatus,
} from './dto';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';

@Injectable()
export class ExternalIntegrationsService {
  private readonly logger = new Logger(ExternalIntegrationsService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

  /**
   * Crea una nueva integración externa
   * @param companyId - ID de la compañía
   * @param createExternalIntegrationDto - DTO con los datos para crear la integración
   * @param userId - ID del usuario que crea la integración
   * @returns Integración externa creada
   * @throws Error si hay un problema al crear la integración
   */
  async create(
    companyId: string, 
    createExternalIntegrationDto: CreateExternalIntegrationDto, 
    userId: string
  ): Promise<ExternalIntegrationDto> {
    try {
      const { data, error } = await this.supabase
        .from('external_integration')
        .insert({
          ...createExternalIntegrationDto,
          company_id: companyId,
          status: createExternalIntegrationDto.status || ExternalIntegrationStatus.ACTIVE,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating external integration: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.CREATE_EXTERNAL_INTEGRATION,
        resourceType: ResourceType.EXTERNAL_INTEGRATION,
        resourceId: data.id,
        userId,
        metadata: {
          name: data.name,
          type: data.type,
          companyId,
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error creating external integration: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las integraciones externas de una compañía
   * @param companyId - ID de la compañía
   * @returns Lista de integraciones externas
   * @throws Error si hay un problema al obtener las integraciones
   */
  async findAll(companyId: string): Promise<ExternalIntegrationDto[]> {
    try {
      const { data, error } = await this.supabase
        .from('external_integration')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching external integrations: ${error.message}`, error);
        throw error;
      }

      return data.map(item => this.transformToCamelCase(item));
    } catch (error) {
      this.logger.error(`Error fetching external integrations: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene una integración externa por su ID
   * @param companyId - ID de la compañía
   * @param id - ID de la integración externa
   * @returns Integración externa encontrada
   * @throws NotFoundException si la integración no existe
   * @throws Error si hay un problema al obtener la integración
   */
  async findOne(companyId: string, id: string): Promise<ExternalIntegrationDto> {
    try {
      const { data, error } = await this.supabase
        .from('external_integration')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error(`Error fetching external integration: ${error.message}`, error);
        throw error;
      }

      if (!data) {
        this.logger.error(`External integration with ID ${id} not found`);
        throw new NotFoundException(`External integration with ID ${id} not found`);
      }

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error fetching external integration: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza una integración externa
   * @param companyId - ID de la compañía
   * @param id - ID de la integración externa
   * @param updateExternalIntegrationDto - DTO con los datos para actualizar la integración
   * @param userId - ID del usuario que actualiza la integración
   * @returns Integración externa actualizada
   * @throws NotFoundException si la integración no existe
   * @throws Error si hay un problema al actualizar la integración
   */
  async update(
    companyId: string,
    id: string,
    updateExternalIntegrationDto: UpdateExternalIntegrationDto,
    userId: string,
  ): Promise<ExternalIntegrationDto> {
    try {
      const current = await this.findOne(companyId, id);
      
      // Preparar el objeto de actualización
      const updateData = {
        ...updateExternalIntegrationDto,
        status: updateExternalIntegrationDto.status || current.status,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await this.supabase
        .from('external_integration')
        .update(updateData)
        .eq('company_id', companyId)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating external integration: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.UPDATE_EXTERNAL_INTEGRATION,
        resourceType: ResourceType.EXTERNAL_INTEGRATION,
        resourceId: data.id,
        userId,
        metadata: {
          name: data.name,
          type: data.type,
          companyId,
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error updating external integration: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Elimina una integración externa
   * @param companyId - ID de la compañía
   * @param id - ID de la integración externa
   * @param userId - ID del usuario que elimina la integración
   * @throws NotFoundException si la integración no existe
   * @throws Error si hay un problema al eliminar la integración
   */
  async remove(companyId: string, id: string, userId: string): Promise<void> {
    try {
      const current = await this.findOne(companyId, id);
      
      // Cambiar el estado a DELETED en lugar de eliminar físicamente
      const { error } = await this.supabase
        .from('external_integration')
        .update({
          status: ExternalIntegrationStatus.DELETED,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId)
        .eq('id', id);

      if (error) {
        this.logger.error(`Error removing external integration: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.DELETE_EXTERNAL_INTEGRATION,
        resourceType: ResourceType.EXTERNAL_INTEGRATION,
        resourceId: id,
        userId,
        metadata: {
          name: current.name,
          type: current.type,
          companyId,
        },
      });
    } catch (error) {
      this.logger.error(`Error removing external integration: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Transforma un objeto de snake_case a camelCase
   * @param data - Objeto a transformar
   * @returns Objeto transformado
   * @private
   */
  private transformToCamelCase(data: any): ExternalIntegrationDto {
    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      type: data.type,
      endpoint: data.endpoint,
      apiKey: data.api_key,
      status: data.status,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
    };
  }
}
