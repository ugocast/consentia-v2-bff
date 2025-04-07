import { UserRole, UserStatus } from '../types/user.types';

/**
 * Generador de datos de prueba para el módulo de autenticación
 */
export const authTestData = {
  /**
   * Crea un objeto de usuario de prueba
   */
  createMockUser: (override = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    user_metadata: {
      name: 'Test User',
    },
    ...override,
  }),

  /**
   * Crea un objeto de sesión de prueba
   */
  createMockSession: (override = {}) => ({
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    ...override,
  }),

  /**
   * Crea un objeto de respuesta de autenticación
   */
  createMockAuthResponse: (userOverride = {}, sessionOverride = {}) => ({
    data: {
      user: authTestData.createMockUser(userOverride),
      session: authTestData.createMockSession(sessionOverride),
    },
    error: null,
  }),
};

/**
 * Generador de datos de prueba para el módulo de empresas
 */
export const companyTestData = {
  /**
   * Crea un objeto de empresa de prueba
   */
  createMockCompany: (override = {}) => ({
    company_id: 'test-company-id',
    company_name: 'Test Company',
    contact_email: 'company@example.com',
    phone: '1234567890',
    subscription_plan: 'STANDARD',
    registered_at: '2023-01-01T00:00:00Z',
    status: 'ACTIVE',
    active_policy_id: 'test-policy-id',
    metadata: {},
    ...override,
  }),

  /**
   * Crea un objeto de configuración de empresa de prueba
   */
  createMockCompanyConfig: (override = {}) => ({
    config_id: 'test-config-id',
    company_id: 'test-company-id',
    configuration: {
      notificationSettings: {
        email: true,
        sms: false,
        push: true,
      },
      privacySettings: {
        retentionDays: 90,
        autoDeleteExpired: true,
      },
      brandingSettings: {
        primaryColor: '#FFFFFF',
        logoUrl: 'https://example.com/logo.png',
      },
    },
    ...override,
  }),

  /**
   * Crea un objeto de usuario de empresa de prueba
   */
  createMockCompanyUser: (override = {}) => ({
    company_user_id: 'test-company-user-id',
    company_id: 'test-company-id',
    auth_id: 'test-user-id',
    full_name: 'Test Company User',
    email: 'company-user@example.com',
    role: UserRole.ADMINISTRATOR,
    status: 'ACTIVE',
    metadata: {},
    ...override,
  }),
};

/**
 * Generador de datos de prueba para el módulo de consentimientos
 */
export const consentTestData = {
  /**
   * Crea un objeto de política legal de prueba
   */
  createMockLegalPolicy: (override = {}) => ({
    legal_policy_id: 'test-policy-id',
    company_id: 'test-company-id',
    version: '1.0.0',
    description: 'Test Legal Policy',
    valid_from: '2023-01-01T00:00:00Z',
    valid_until: null,
    status: 'ACTIVE',
    metadata: {},
    ...override,
  }),

  /**
   * Crea un objeto de consentimiento de prueba
   */
  createMockConsent: (override = {}) => ({
    consent_id: 'test-consent-id',
    data_subject_id: 'test-data-subject-id',
    company_id: 'test-company-id',
    legal_policy_id: 'test-policy-id',
    channel: 'EMAIL',
    purpose: 'Marketing communications',
    status: 'ACCEPTED',
    consented_at: '2023-01-01T00:00:00Z',
    expires_at: '2024-01-01T00:00:00Z',
    pdf_url: 'https://example.com/consent.pdf',
    metadata: {},
    ...override,
  }),

  /**
   * Crea un objeto de tipo de dato de prueba
   */
  createMockDataType: (override = {}) => ({
    data_type_id: 'test-data-type-id',
    name: 'Email',
    description: 'Email address for communication',
    status: 'ACTIVE',
    ...override,
  }),
};

/**
 * Utilidades para pruebas de JWT
 */
export const jwtTestUtils = {
  /**
   * Crea un token JWT de prueba
   */
  createMockJwt: (payload = {}) => {
    const defaultPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: UserRole.ADMINISTRATOR,
      company_id: 'test-company-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
      JSON.stringify({ ...defaultPayload, ...payload }),
    ).toString('base64')}.test-signature`;
  },
  
  /**
   * Crea un mock de la solicitud con un usuario autenticado
   */
  createMockRequestWithUser: (userOverride = {}) => {
    const user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: UserRole.ADMINISTRATOR,
      companyId: 'test-company-id',
      ...userOverride,
    };
    
    return {
      user,
      headers: {
        authorization: `Bearer ${jwtTestUtils.createMockJwt({
          sub: user.id,
          email: user.email,
          role: user.role,
          company_id: user.companyId,
        })}`,
      },
    };
  },
};

export interface TestUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  company_id: string;
  metadata?: Record<string, any>;
}

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: UserRole.ADMINISTRATOR,
    status: UserStatus.ACTIVE,
    company_id: 'test-company-id',
    metadata: {},
    ...overrides,
  };
}

export function createTestCompany(overrides: Record<string, any> = {}) {
  return {
    company_id: 'test-company-id',
    company_name: 'Test Company',
    contact_email: 'company@example.com',
    phone: '1234567890',
    subscription_plan: 'STANDARD',
    registered_at: new Date(),
    status: 'ACTIVE',
    active_policy_id: null,
    metadata: {},
    ...overrides,
  };
}

export function createTestDataSubject(overrides: Record<string, any> = {}) {
  return {
    data_subject_id: 'test-data-subject-id',
    auth_id: 'test-user-id',
    full_name: 'Test Data Subject',
    phone: '9876543210',
    status: 'ACTIVE',
    metadata: {},
    ...overrides,
  };
}

export function createTestConsent(overrides: Record<string, any> = {}) {
  return {
    consent_id: 'test-consent-id',
    data_subject_id: 'test-data-subject-id',
    company_id: 'test-company-id',
    legal_policy_id: 'test-legal-policy-id',
    channel: 'EMAIL',
    purpose: 'Marketing Communications',
    status: 'ACCEPTED',
    consented_at: new Date(),
    expires_at: null,
    pdf_url: null,
    metadata: {},
    ...overrides,
  };
}

export function createTestLegalPolicy(overrides: Record<string, any> = {}) {
  return {
    legal_policy_id: 'test-legal-policy-id',
    company_id: 'test-company-id',
    version: '1.0',
    description: 'Test Legal Policy',
    valid_from: new Date(),
    valid_until: null,
    status: 'DRAFT',
    metadata: {},
    ...overrides,
  };
}

export function createTestDataType(overrides: Record<string, any> = {}) {
  return {
    data_type_id: 'test-data-type-id',
    name: 'Email Address',
    description: 'User email address',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function createTestConsentDataType(overrides: Record<string, any> = {}) {
  return {
    consent_id: 'test-consent-id',
    data_type_id: 'test-data-type-id',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function createTestAuditLog(overrides: Record<string, any> = {}) {
  return {
    audit_id: 'test-audit-id',
    company_user_id: 'test-company-user-id',
    data_subject_id: 'test-data-subject-id',
    action: 'CONSENT_CREATED',
    ip_address: '127.0.0.1',
    action_at: new Date(),
    details: {},
    ...overrides,
  };
}

export function createRelatedTestData(overrides: Record<string, any> = {}) {
  const company = createTestCompany(overrides.company);
  const user = createTestUser({ company_id: company.company_id, ...overrides.user });
  const dataSubject = createTestDataSubject({ auth_id: user.id, ...overrides.dataSubject });
  const legalPolicy = createTestLegalPolicy({ company_id: company.company_id, ...overrides.legalPolicy });
  const consent = createTestConsent({
    data_subject_id: dataSubject.data_subject_id,
    company_id: company.company_id,
    legal_policy_id: legalPolicy.legal_policy_id,
    ...overrides.consent,
  });
  const dataType = createTestDataType(overrides.dataType);
  const consentDataType = createTestConsentDataType({
    consent_id: consent.consent_id,
    data_type_id: dataType.data_type_id,
    ...overrides.consentDataType,
  });
  const auditLog = createTestAuditLog({
    company_user_id: user.id,
    data_subject_id: dataSubject.data_subject_id,
    ...overrides.auditLog,
  });

  return {
    user,
    company,
    dataSubject,
    legalPolicy,
    consent,
    dataType,
    consentDataType,
    auditLog,
  };
} 