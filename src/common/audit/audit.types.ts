/**
 * Tipos de acciones de auditoría
 */
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  SET_ACTIVE_COMPANY = 'SET_ACTIVE_COMPANY',
  CREATE_COMPANY_USER = 'CREATE_COMPANY_USER',
  UPDATE_COMPANY_USER = 'UPDATE_COMPANY_USER',
  DELETE_COMPANY_USER = 'DELETE_COMPANY_USER',
  CHANGE_USER_STATUS = 'CHANGE_USER_STATUS',
  CHANGE_USER_ROLE = 'CHANGE_USER_ROLE',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  UPDATE_PROFILE = 'update_profile',
  REQUEST_PASSWORD_RESET = 'request_password_reset',
  DELETE_ACCOUNT = 'delete_account',
  CREATE_COMPANY = 'create_company',
  UPDATE_COMPANY = 'update_company',
  DELETE_COMPANY = 'delete_company',
  UPDATE_COMPANY_CONFIG = 'update_company_config',
  UPDATE_COMPANY_SUBSCRIPTION = 'update_company_subscription',
  CHANGE_COMPANY_USER_ROLE = 'change_company_user_role',
  CHANGE_COMPANY_USER_STATUS = 'change_company_user_status',
}

/**
 * Tipos de recursos que pueden ser auditados
 */
export enum ResourceType {
  USER = 'USER',
  POLICY = 'POLICY',
  CONSENT = 'CONSENT',
  REPORT = 'REPORT',
  SYSTEM = 'SYSTEM',
  COMPANY = 'COMPANY',
  COMPANY_USER = 'COMPANY_USER',
  DATA_SUBJECT = 'data_subject',
  LEGAL_POLICY = 'legal_policy',
  INVITATION = 'invitation',
}

/**
 * Interfaz para los filtros de búsqueda de logs de auditoría
 */
export interface AuditLogFilters {
  userId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  companyId?: string;
}

/**
 * Interfaz para la respuesta de logs de auditoría
 */
export interface AuditLogResponse {
  logs: any[];
  total: number;
}

/**
 * Interfaz para los detalles de una acción auditada
 */
export interface AuditDetails {
  [key: string]: any;
}

/**
 * Interfaz para un registro de auditoría
 */
export interface AuditLog {
  id: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  timestamp: string;
  details?: AuditDetails;
  companyId?: string;
}
