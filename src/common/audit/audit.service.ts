import { Injectable, Logger } from '@nestjs/common';
import { createSupabaseClient } from '../../config/supabase.config';

/**
 * Tipo de acción para el registro de auditoría
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CREATE_POLICY = 'CREATE_POLICY',
  UPDATE_POLICY = 'UPDATE_POLICY',
  DELETE_POLICY = 'DELETE_POLICY',
  CREATE_CONSENT = 'CREATE_CONSENT',
  UPDATE_CONSENT = 'UPDATE_CONSENT',
  REVOKE_CONSENT = 'REVOKE_CONSENT',
}

/**
 * Tipo de recurso para el registro de auditoría
 */
export enum ResourceType {
  POLICY = 'POLICY',
  CONSENT = 'CONSENT',
  CONSENT_REQUEST = 'CONSENT_REQUEST',
  USER = 'USER',
}

/**
 * Interfaz para los datos de auditoría
 */
export interface AuditLogEntry {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  userId?: string;
  previousResourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Servicio para registrar acciones importantes en el log de auditoría
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  /**
   * Registra una acción en el log de auditoría
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase.from('audit_log').insert({
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        user_id: entry.userId,
        previous_resource_id: entry.previousResourceId,
        metadata: entry.metadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      });

      if (error) {
        this.logger.error(
          `Error al registrar en el log de auditoría: ${error.message}`,
          error,
        );
      }
    } catch (error) {
      this.logger.error('Error al registrar en el log de auditoría', error);
    }
  }

  /**
   * Obtiene los registros de auditoría
   */
  async getAuditLogs(
    filters: {
      userId?: string;
      resourceType?: ResourceType;
      resourceId?: string;
      action?: AuditAction;
      startDate?: string;
      endDate?: string;
    },
    page = 1,
    pageSize = 10,
  ): Promise<{ items: any[]; total: number }> {
    try {
      const { userId, resourceType, resourceId, action, startDate, endDate } =
        filters;
      const offset = (page - 1) * pageSize;

      let query = this.supabase
        .from('audit_log')
        .select('*', { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        this.logger.error(
          `Error al obtener logs de auditoría: ${error.message}`,
          error,
        );
        throw new Error(`Error al obtener logs de auditoría: ${error.message}`);
      }

      return {
        items: data,
        total: count || 0,
      };
    } catch (error) {
      this.logger.error('Error al obtener logs de auditoría', error);
      throw error;
    }
  }
}
