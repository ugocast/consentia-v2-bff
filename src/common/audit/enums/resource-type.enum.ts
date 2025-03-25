/**
 * Enum que define los tipos de recursos que pueden ser registrados en el log de auditoría
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
} 