import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  ConsentDataTypeDto,
  CreateConsentDataTypeDto,
  UpdateConsentDataTypeDto,
  ConsentDataTypeStatus,
} from './dto';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';

@Injectable()
export class ConsentDataTypesService {
  private readonly logger = new Logger(ConsentDataTypesService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

  /**
   * Crea un nuevo tipo de dato de consentimiento
   * @param createConsentDataTypeDto - DTO con los datos para crear el tipo de dato de consentimiento
   * @param userId - ID del usuario que crea el tipo de dato de consentimiento
   * @returns Tipo de dato de consentimiento creado
   * @throws Error si hay un problema al crear el tipo de dato de consentimiento
   */
  async create(
    createConsentDataTypeDto: CreateConsentDataTypeDto, 
    userId: string
  ): Promise<ConsentDataTypeDto> {
    try {
      const { data, error } = await this.supabase
        .from('consent_data_type')
        .insert({
          consent_id: createConsentDataTypeDto.consentId,
          data_type_id: createConsentDataTypeDto.dataTypeId,
          status: createConsentDataTypeDto.status || ConsentDataTypeStatus.ACTIVE,
          metadata: createConsentDataTypeDto.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating consent data type: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.CREATE_CONSENT_DATA_TYPE,
        resourceType: ResourceType.CONSENT_DATA_TYPE,
        resourceId: data.id,
        userId,
        metadata: {
          consentId: data.consent_id,
          dataTypeId: data.data_type_id,
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error creating consent data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los tipos de datos de un consentimiento
   * @param consentId - ID del consentimiento
   * @returns Lista de tipos de datos de consentimiento
   * @throws Error si hay un problema al obtener los tipos de datos
   */
  async findAll(consentId: string): Promise<ConsentDataTypeDto[]> {
    try {
      const { data, error } = await this.supabase
        .from('consent_data_type')
        .select('*')
        .eq('consent_id', consentId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching consent data types: ${error.message}`, error);
        throw error;
      }

      return data.map(item => this.transformToCamelCase(item));
    } catch (error) {
      this.logger.error(`Error fetching consent data types: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene un tipo de dato de consentimiento por su ID
   * @param id - ID del tipo de dato de consentimiento
   * @returns Tipo de dato de consentimiento encontrado
   * @throws NotFoundException si el tipo de dato no existe
   * @throws Error si hay un problema al obtener el tipo de dato
   */
  async findOne(id: string): Promise<ConsentDataTypeDto> {
    try {
      const { data, error } = await this.supabase
        .from('consent_data_type')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error(`Error fetching consent data type: ${error.message}`, error);
        throw error;
      }

      if (!data) {
        this.logger.error(`Consent data type with ID ${id} not found`);
        throw new NotFoundException(`Consent data type with ID ${id} not found`);
      }

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error fetching consent data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza un tipo de dato de consentimiento
   * @param id - ID del tipo de dato de consentimiento
   * @param updateConsentDataTypeDto - DTO con los datos para actualizar el tipo de dato
   * @param userId - ID del usuario que actualiza el tipo de dato
   * @returns Tipo de dato de consentimiento actualizado
   * @throws NotFoundException si el tipo de dato no existe
   * @throws Error si hay un problema al actualizar el tipo de dato
   */
  async update(
    id: string,
    updateConsentDataTypeDto: UpdateConsentDataTypeDto,
    userId: string,
  ): Promise<ConsentDataTypeDto> {
    try {
      const current = await this.findOne(id);
      
      // Preparar el objeto de actualización
      const updateData = {
        status: updateConsentDataTypeDto.status || current.status,
        metadata: updateConsentDataTypeDto.metadata || current.metadata,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await this.supabase
        .from('consent_data_type')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating consent data type: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.UPDATE_CONSENT_DATA_TYPE,
        resourceType: ResourceType.CONSENT_DATA_TYPE,
        resourceId: data.id,
        userId,
        metadata: {
          consentId: data.consent_id,
          dataTypeId: data.data_type_id,
          previousStatus: current.status,
          newStatus: data.status,
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error updating consent data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Elimina un tipo de dato de consentimiento (cambia su estado a DELETED)
   * @param id - ID del tipo de dato de consentimiento
   * @param userId - ID del usuario que elimina el tipo de dato
   * @throws NotFoundException si el tipo de dato no existe
   * @throws Error si hay un problema al eliminar el tipo de dato
   */
  async remove(id: string, userId: string): Promise<void> {
    try {
      const current = await this.findOne(id);
      
      // Cambiar el estado a DELETED en lugar de eliminar físicamente
      const { error } = await this.supabase
        .from('consent_data_type')
        .update({
          status: ConsentDataTypeStatus.DELETED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        this.logger.error(`Error removing consent data type: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.DELETE_CONSENT_DATA_TYPE,
        resourceType: ResourceType.CONSENT_DATA_TYPE,
        resourceId: id,
        userId,
        metadata: {
          consentId: current.consentId,
          dataTypeId: current.dataTypeId,
        },
      });
    } catch (error) {
      this.logger.error(`Error removing consent data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Transforma un objeto de snake_case a camelCase
   * @param data - Objeto a transformar
   * @returns Objeto transformado
   * @private
   */
  private transformToCamelCase(data: any): ConsentDataTypeDto {
    return {
      id: data.id,
      consentId: data.consent_id,
      dataTypeId: data.data_type_id,
      status: data.status,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
