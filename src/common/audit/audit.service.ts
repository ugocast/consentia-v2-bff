import { Injectable, Logger } from '@nestjs/common';
import { createSupabaseClient } from '../../config/supabase.config';
import { AuditEvent } from './audit.interface';

/**
 * Tipo de acción para el registro de auditoría
 */
export enum AuditAction {
  // Acciones generales
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',

  // Acciones de consentimiento
  CREATE_CONSENT = 'create_consent',
  UPDATE_CONSENT = 'update_consent',
  REVOKE_CONSENT = 'revoke_consent',
  DENY_CONSENT = 'deny_consent',
  GRANT_CONSENT = 'grant_consent',
  WITHDRAW_CONSENT = 'withdraw_consent',
  EXPORT_CONSENT = 'export_consent',
  IMPORT_CONSENT = 'import_consent',

  // Acciones de operaciones masivas
  CREATE_BULK_OPERATION = 'create_bulk_operation',
  UPDATE_BULK_OPERATION = 'update_bulk_operation',
  DELETE_BULK_OPERATION = 'delete_bulk_operation',
  PROCESS_BULK_OPERATION = 'process_bulk_operation',
  COMPLETE_BULK_OPERATION = 'complete_bulk_operation',
  UPDATE_BULK_OPERATION_STATUS = 'update_bulk_operation_status',
  CANCEL_BULK_OPERATION = 'cancel_bulk_operation',
  FAIL_BULK_OPERATION = 'fail_bulk_operation',

  // Acciones de usuario
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  BLOCK_USER = 'block_user',
  UNBLOCK_USER = 'unblock_user',
  RESET_PASSWORD = 'reset_password',
  CHANGE_PASSWORD = 'change_password',

  // Acciones de compañía
  CREATE_COMPANY = 'create_company',
  UPDATE_COMPANY = 'update_company',
  DELETE_COMPANY = 'delete_company',
  ACTIVATE_COMPANY = 'activate_company',
  DEACTIVATE_COMPANY = 'deactivate_company',
  UPDATE_COMPANY_CONFIG = 'update_company_config',
  UPDATE_COMPANY_SUBSCRIPTION = 'update_company_subscription',

  // Acciones de política
  CREATE_POLICY = 'create_policy',
  UPDATE_POLICY = 'update_policy',
  DELETE_POLICY = 'delete_policy',
  PUBLISH_POLICY = 'publish_policy',
  ARCHIVE_POLICY = 'archive_policy',

  // Acciones de tipo de datos
  CREATE_DATA_TYPE = 'create_data_type',
  UPDATE_DATA_TYPE = 'update_data_type',
  DELETE_DATA_TYPE = 'delete_data_type',
  IMPORT_DATA_TYPE = 'import_data_type',
  EXPORT_DATA_TYPE = 'export_data_type',

  // Acciones de configuración
  UPDATE_CONFIG = 'update_config',
  RESET_CONFIG = 'reset_config',
  IMPORT_CONFIG = 'import_config',
  EXPORT_CONFIG = 'export_config',

  // Acciones de integración externa
  CREATE_EXTERNAL_INTEGRATION = 'create_external_integration',
  UPDATE_EXTERNAL_INTEGRATION = 'update_external_integration',
  DELETE_EXTERNAL_INTEGRATION = 'delete_external_integration',
  ACTIVATE_EXTERNAL_INTEGRATION = 'activate_external_integration',
  DEACTIVATE_EXTERNAL_INTEGRATION = 'deactivate_external_integration',
  
  // Acciones de usuario de compañía
  CREATE_COMPANY_USER = 'create_company_user',
  UPDATE_COMPANY_USER = 'update_company_user',
  DELETE_COMPANY_USER = 'delete_company_user',
  ACTIVATE_COMPANY_USER = 'activate_company_user',
  SUSPEND_COMPANY_USER = 'suspend_company_user',
  CHANGE_USER_STATUS = 'change_user_status',
  CHANGE_USER_ROLE = 'change_user_role',
  
  // Acciones de tipo de dato de consentimiento
  CREATE_CONSENT_DATA_TYPE = 'create_consent_data_type',
  UPDATE_CONSENT_DATA_TYPE = 'update_consent_data_type',
  DELETE_CONSENT_DATA_TYPE = 'delete_consent_data_type',
}

/**
 * Tipo de recurso para el registro de auditoría
 */
export enum ResourceType {
  // Recursos generales
  SYSTEM = 'system',
  AUDIT_LOG = 'audit_log',

  // Recursos de usuario
  USER = 'user',
  USER_ROLE = 'user_role',
  USER_PERMISSION = 'user_permission',

  // Recursos de compañía
  COMPANY = 'company',
  COMPANY_CONFIG = 'company_config',
  COMPANY_SUBSCRIPTION = 'company_subscription',

  // Recursos de consentimiento
  CONSENT = 'consent',
  CONSENT_REQUEST = 'consent_request',
  CONSENT_STATUS = 'consent_status',

  // Recursos de operaciones masivas
  BULK_OPERATION = 'bulk_operation',
  BULK_OPERATION_STATUS = 'bulk_operation_status',

  // Recursos de política
  POLICY = 'policy',
  POLICY_VERSION = 'policy_version',
  POLICY_STATUS = 'policy_status',

  // Recursos de tipo de datos
  DATA_TYPE = 'data_type',
  DATA_TYPE_CATEGORY = 'data_type_category',
  DATA_TYPE_MAPPING = 'data_type_mapping',

  // Recursos de configuración
  CONFIG = 'config',
  CONFIG_TEMPLATE = 'config_template',
  CONFIG_VERSION = 'config_version',
  
  // Recursos de integración externa
  EXTERNAL_INTEGRATION = 'external_integration',
  
  // Recursos de usuario de compañía
  COMPANY_USER = 'company_user',
  COMPANY_USER_ROLE = 'company_user_role',
  
  // Recursos de tipo de dato de consentimiento
  CONSENT_DATA_TYPE = 'consent_data_type',
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

  /**
   * Registra un evento en el log de auditoría (método compatible con nueva interfaz)
   */
  async logEvent(event: AuditEvent): Promise<void> {
    // Mapear de AuditAction de audit.types (mayúsculas) a AuditAction de audit.service (minúsculas)
    let actionValue: string;
    switch (event.action) {
      case 'REGISTER':
        actionValue = AuditAction.CREATE_USER;
        break;
      case 'LOGIN':
        actionValue = AuditAction.READ;
        break;
      case 'LOGOUT':
        actionValue = AuditAction.UPDATE_USER;
        break;
      case 'RESET_PASSWORD':
        actionValue = AuditAction.RESET_PASSWORD;
        break;
      case 'CHANGE_PASSWORD':
        actionValue = AuditAction.CHANGE_PASSWORD;
        break;
      default:
        actionValue = String(event.action).toLowerCase();
    }

    // Mapear de ResourceType de audit.types (mayúsculas) a ResourceType de audit.service (minúsculas)
    let resourceTypeValue: string;
    switch (event.resourceType) {
      case 'USER':
        resourceTypeValue = ResourceType.USER;
        break;
      default:
        resourceTypeValue = String(event.resourceType).toLowerCase();
    }

    return this.log({
      action: actionValue as any,
      resourceType: resourceTypeValue as any,
      resourceId: event.resourceId,
      userId: event.userId,
      metadata: event.details
    });
  }
}
