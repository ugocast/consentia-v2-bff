import { v4 as uuidv4 } from 'uuid';

/**
 * Factory function para crear datos de consentimiento para pruebas
 */
export const createConsentFixture = (overrides: Partial<ConsentFixture> = {}): ConsentFixture => {
  const id = overrides.id || uuidv4();
  const dataSubjectId = overrides.data_subject_id || uuidv4();
  const consentTypeId = overrides.consent_type_id || uuidv4();
  const companyId = overrides.company_id || uuidv4();
  
  return {
    id,
    data_subject_id: dataSubjectId,
    consent_type_id: consentTypeId,
    company_id: companyId,
    status: overrides.status || 'active',
    obtained_via: overrides.obtained_via || 'web_form',
    obtained_at: overrides.obtained_at || new Date().toISOString(),
    ip_address: overrides.ip_address || '192.168.1.1',
    user_agent: overrides.user_agent || 'Mozilla/5.0 (Testing)',
    expires_at: overrides.expires_at || new Date(Date.now() + 31536000000).toISOString(), // 1 año
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    active: overrides.active !== undefined ? overrides.active : true,
    metadata: overrides.metadata || { test: true },
    ...overrides
  };
};

/**
 * Crear múltiples consentimientos para pruebas
 */
export const createManyConsentFixtures = (
  count: number,
  dataSubjectId: string = uuidv4(),
  consentTypeId: string = uuidv4(),
  companyId: string = uuidv4(),
  overrides: Partial<ConsentFixture> = {}
): ConsentFixture[] => {
  return Array.from({ length: count }, (_, index) => 
    createConsentFixture({ 
      data_subject_id: dataSubjectId,
      consent_type_id: consentTypeId,
      company_id: companyId,
      status: overrides.status || (index % 2 === 0 ? 'active' : 'revoked'),
      ...overrides
    })
  );
};

/**
 * Interfaces para los fixtures
 */
export interface ConsentFixture {
  id: string;
  data_subject_id: string;
  consent_type_id: string;
  company_id: string;
  status: string;
  obtained_via: string;
  obtained_at: string;
  ip_address?: string;
  user_agent?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  metadata?: Record<string, any>;
  [key: string]: any;
} 