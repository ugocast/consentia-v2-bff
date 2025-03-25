/**
 * Enum que define los tipos de acciones que pueden ser registradas en el log de auditoría
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
  ACTIVATE_DATA_TYPE = 'activate_data_type',
  DEACTIVATE_DATA_TYPE = 'deactivate_data_type',
} 