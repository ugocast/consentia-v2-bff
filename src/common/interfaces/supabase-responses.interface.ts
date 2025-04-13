/**
 * Interfaces para las respuestas de Supabase
 */

/**
 * Estructura básica de datos de Supabase
 */
export interface SupabaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interfaz para un tipo de dato
 */
export interface DataTypeEntity extends SupabaseEntity {
  name: string;
  code: string;
  description?: string;
  category?: string;
}

/**
 * Interfaz para una política legal
 */
export interface LegalPolicyEntity extends SupabaseEntity {
  title: string;
  description?: string;
  content?: string;
  version?: string;
  is_active?: boolean;
  status?: string;
  valid_from?: string;
  valid_to?: string;
  company_id?: string;
  previous_version_id?: string;
}

/**
 * Interfaz para una solicitud de consentimiento
 */
export interface ConsentRequestEntity extends SupabaseEntity {
  data_subject_id: string;
  legal_policy_id: string;
  company_id?: string;
  status: string;
  token?: string;
  purpose?: string;
  channel?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

/**
 * Interfaz para un consentimiento en la relación de tipos de datos
 */
export interface ConsentDataTypeEntity extends SupabaseEntity {
  data_type_id: string;
  consent_id: string;
  data_type?: DataTypeEntity | DataTypeEntity[];
}

/**
 * Interfaz para un consentimiento
 */
export interface ConsentEntity extends SupabaseEntity {
  data_subject_id: string;
  legal_policy_id: string;
  consent_request_id?: string;
  status: string;
  reason?: string;
  is_mandatory?: boolean;
  expiry_date?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  consent_data_type?: ConsentDataTypeEntity[];
  legal_policy?: LegalPolicyEntity | LegalPolicyEntity[];
  consent_request?: ConsentRequestEntity | ConsentRequestEntity[];
}

/**
 * Interfaz para un titular de datos
 */
export interface DataSubjectEntity extends SupabaseEntity {
  full_name: string;
  email: string;
  phone?: string;
  external_id?: string;
  company_id?: string;
  status: string;
  verified?: boolean;
  verification_token?: string;
  verification_token_expiry?: string;
  portal_access_token?: string;
  portal_access_token_expiry?: string;
  last_portal_access?: string;
  metadata?: Record<string, any>;
}

/**
 * Interfaz para una solicitud de titular de datos
 */
export interface DataSubjectRequestEntity extends SupabaseEntity {
  data_subject_id: string;
  type: 'access' | 'deletion' | 'rectification' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
} 