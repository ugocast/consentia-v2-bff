export enum Permission {
  // Permisos generales de empresa
  MANAGE_COMPANY = 'manage_company',
  VIEW_COMPANY = 'view_company',
  EDIT_COMPANY = 'edit_company',
  
  // Permisos de usuarios
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  CHANGE_USER_ROLE = 'change_user_role',
  INVITE_USER = 'invite_user',
  
  // Permisos de consentimientos
  VIEW_CONSENTS = 'view_consents',
  CREATE_CONSENT = 'create_consent',
  EDIT_CONSENT = 'edit_consent',
  DELETE_CONSENT = 'delete_consent',
  EXPORT_CONSENTS = 'export_consents',
  
  // Permisos de políticas
  VIEW_POLICIES = 'view_policies',
  CREATE_POLICY = 'create_policy',
  EDIT_POLICY = 'edit_policy',
  DELETE_POLICY = 'delete_policy',
  PUBLISH_POLICY = 'publish_policy',
  
  // Permisos de titulares de datos
  VIEW_DATA_SUBJECTS = 'view_data_subjects',
  CREATE_DATA_SUBJECT = 'create_data_subject',
  EDIT_DATA_SUBJECT = 'edit_data_subject',
  DELETE_DATA_SUBJECT = 'delete_data_subject',
  EXPORT_DATA_SUBJECTS = 'export_data_subjects',
  
  // Permisos de auditoría
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  EXPORT_AUDIT_LOGS = 'export_audit_logs',
  
  // Permisos de configuración
  VIEW_SETTINGS = 'view_settings',
  EDIT_SETTINGS = 'edit_settings',
  
  // Permisos de reportes
  VIEW_REPORTS = 'view_reports',
  CREATE_REPORT = 'create_report',
  SCHEDULE_REPORT = 'schedule_report',
  
  // Permisos de integraciones
  MANAGE_INTEGRATIONS = 'manage_integrations',
  VIEW_INTEGRATIONS = 'view_integrations',
  
  // Permisos de operaciones masivas
  VIEW_BULK_OPERATIONS = 'view_bulk_operations',
  CREATE_BULK_OPERATION = 'create_bulk_operation',
  CANCEL_BULK_OPERATION = 'cancel_bulk_operation'
} 