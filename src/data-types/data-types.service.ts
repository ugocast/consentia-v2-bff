import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  DataTypeDto,
  CreateDataTypeDto,
  UpdateDataTypeDto,
} from './dto';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';

@Injectable()
export class DataTypesService {
  private readonly logger = new Logger(DataTypesService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

  /**
   * Crea un nuevo tipo de datos
   * @param createDataTypeDto - DTO con los datos para crear el tipo de datos
   * @param userId - ID del usuario que crea el tipo de datos
   * @returns Tipo de datos creado
   * @throws Error si hay un problema al crear el tipo de datos
   */
  async create(createDataTypeDto: CreateDataTypeDto, userId: string): Promise<DataTypeDto> {
    try {
      const { data, error } = await this.supabase
        .from('data_types')
        .insert({
          ...createDataTypeDto,
          version: 1,
          status: createDataTypeDto.status || 'active',
          created_by: userId,
          updated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error creating data type: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.CREATE_DATA_TYPE,
        resourceType: ResourceType.DATA_TYPE,
        resourceId: data.id,
        userId,
        metadata: {
          name: data.name,
          type: data.type
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error creating data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los tipos de datos
   * @returns Lista de tipos de datos
   * @throws Error si hay un problema al obtener los tipos de datos
   */
  async findAll(): Promise<DataTypeDto[]> {
    try {
      const { data, error } = await this.supabase
        .from('data_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching data types: ${error.message}`, error);
        throw error;
      }

      return data.map(item => this.transformToCamelCase(item));
    } catch (error) {
      this.logger.error(`Error fetching data types: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene un tipo de datos por su ID
   * @param id - ID del tipo de datos a buscar
   * @returns Tipo de datos encontrado
   * @throws NotFoundException si el tipo de datos no existe
   * @throws Error si hay un problema al obtener el tipo de datos
   */
  async findOne(id: string): Promise<DataTypeDto> {
    try {
      const { data, error } = await this.supabase
        .from('data_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error(`Error fetching data type: ${error.message}`, error);
        throw error;
      }

      if (!data) {
        this.logger.error(`Data type with ID ${id} not found`);
        throw new NotFoundException(`Data type with ID ${id} not found`);
      }

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error fetching data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza un tipo de datos
   * @param id - ID del tipo de datos a actualizar
   * @param updateDataTypeDto - DTO con los datos para actualizar el tipo de datos
   * @param userId - ID del usuario que actualiza el tipo de datos
   * @returns Tipo de datos actualizado
   * @throws NotFoundException si el tipo de datos no existe
   * @throws Error si hay un problema al actualizar el tipo de datos
   */
  async update(
    id: string,
    updateDataTypeDto: UpdateDataTypeDto,
    userId: string,
  ): Promise<DataTypeDto> {
    try {
      const current = await this.findOne(id);
      
      // Preparar el objeto de actualización
      const updateData = {
        ...updateDataTypeDto,
        version: current.version + 1,
        status: updateDataTypeDto.status || current.status, // Mantener el status existente si no se proporciona uno nuevo
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await this.supabase
        .from('data_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error updating data type: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.UPDATE_DATA_TYPE,
        resourceType: ResourceType.DATA_TYPE,
        resourceId: data.id,
        userId,
        metadata: {
          name: data.name,
          type: data.type,
          previousVersion: current.version,
          newVersion: data.version
        },
      });

      return this.transformToCamelCase(data);
    } catch (error) {
      this.logger.error(`Error updating data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Elimina un tipo de datos
   * @param id - ID del tipo de datos a eliminar
   * @param userId - ID del usuario que elimina el tipo de datos
   * @throws NotFoundException si el tipo de datos no existe
   * @throws Error si hay un problema al eliminar el tipo de datos
   */
  async remove(id: string, userId: string): Promise<void> {
    try {
      const current = await this.findOne(id);
      const { error } = await this.supabase
        .from('data_types')
        .delete()
        .eq('id', id);

      if (error) {
        this.logger.error(`Error deleting data type: ${error.message}`, error);
        throw error;
      }

      await this.auditService.log({
        action: AuditAction.DELETE_DATA_TYPE,
        resourceType: ResourceType.DATA_TYPE,
        resourceId: id,
        userId,
        metadata: {
          name: current.name,
          type: current.type
        },
      });
    } catch (error) {
      this.logger.error(`Error deleting data type: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Transforma un objeto de snake_case a camelCase
   * @param data - Objeto a transformar
   * @returns Objeto transformado
   * @private
   */
  private transformToCamelCase(data: any): DataTypeDto {
    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      code: data.code,
      description: data.description,
      type: data.type,
      config: data.config,
      required: data.required,
      unique: data.unique,
      sensitive: data.sensitive,
      active: data.is_active,
      version: data.version,
      validation: data.validation,
      status: data.status || 'active',
      metadata: data.metadata,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
