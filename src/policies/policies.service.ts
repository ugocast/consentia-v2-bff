import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  AuditService,
  AuditAction,
  ResourceType,
} from '../common/audit/audit.service';
import { CreatePolicyDto, UpdatePolicyDto, PolicyDto } from './dto';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

  /**
   * Obtiene todas las políticas activas
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

      return data as PolicyDto[];
    } catch (error) {
      this.logger.error('Error al obtener políticas', error);
      throw error;
    }
  }

  /**
   * Crea una nueva política
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
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error al crear política: ${error.message}`, error);
        throw new Error(`Error al crear política: ${error.message}`);
      }

      // Registrar la acción en el log de auditoría
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

      return data as PolicyDto;
    } catch (error) {
      this.logger.error('Error al crear política', error);
      throw error;
    }
  }

  /**
   * Obtiene una política por su ID
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

      return data as PolicyDto;
    } catch (error) {
      this.logger.error(`Error al obtener política: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Actualiza una política (crea una nueva versión)
   */
  async update(
    id: string,
    updatePolicyDto: UpdatePolicyDto,
    userId: string,
  ): Promise<PolicyDto> {
    try {
      // Obtener la política actual
      const { data: currentPolicy, error: fetchError } = await this.supabase
        .from('legal_policy')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentPolicy) {
        this.logger.error(`Política no encontrada: ${fetchError?.message}`);
        throw new NotFoundException('Política no encontrada');
      }

      // Crear una nueva versión de la política
      const { data: newPolicy, error: insertError } = await this.supabase
        .from('legal_policy')
        .insert({
          title: updatePolicyDto.title,
          content: updatePolicyDto.content,
          previous_version_id: id,
          company_id: currentPolicy.company_id,
          valid_from: new Date().toISOString(),
          data_types: updatePolicyDto.dataTypes,
        })
        .select()
        .single();

      if (insertError) {
        this.logger.error(
          `Error al crear nueva versión de la política: ${insertError.message}`,
          insertError,
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

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: newPolicy.id,
        userId,
        previousResourceId: id,
        metadata: {
          title: updatePolicyDto.title,
          companyId: currentPolicy.company_id,
        },
      });

      return newPolicy as PolicyDto;
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
   */
  async findVersions(id: string): Promise<PolicyDto[]> {
    try {
      // Obtener la política actual
      const { data: currentPolicy, error: fetchError } = await this.supabase
        .from('legal_policy')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentPolicy) {
        this.logger.error(`Política no encontrada: ${fetchError?.message}`);
        throw new NotFoundException('Política no encontrada');
      }

      // Obtener todas las versiones relacionadas
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

      return data as PolicyDto[];
    } catch (error) {
      this.logger.error(`Error al obtener versiones: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Elimina una política (soft delete)
   */
  async remove(id: string, userId: string): Promise<void> {
    try {
      // Obtener la política actual
      const { data: currentPolicy, error: fetchError } = await this.supabase
        .from('legal_policy')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentPolicy) {
        this.logger.error(`Política no encontrada: ${fetchError?.message}`);
        throw new NotFoundException('Política no encontrada');
      }

      // Actualizar la fecha de validez para hacer un soft delete
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

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.DELETE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: id,
        userId,
        metadata: {
          title: currentPolicy.title,
          companyId: currentPolicy.company_id,
        },
      });
    } catch (error) {
      this.logger.error(`Error al eliminar política: ${error.message}`, error);
      throw error;
    }
  }
}
