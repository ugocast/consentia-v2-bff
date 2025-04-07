import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, UserStatus } from '../../../src/common/types/user.types';

// Tipos para los mocks
type MockSupabaseClient = {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  limit: jest.Mock;
  where: jest.Mock;
  values: jest.Mock;
  returning: jest.Mock;
  execute: jest.Mock;
};

type MockDrizzleClient = {
  select: jest.Mock;
  from: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  where: jest.Mock;
  values: jest.Mock;
  returning: jest.Mock;
  execute: jest.Mock;
  transaction: jest.Mock;
};

// Mock de Supabase
export const mockSupabaseClient: MockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

// Mock de Drizzle
export const mockDrizzleClient: MockDrizzleClient = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  transaction: jest.fn(),
};

// Mock de Pool
export const mockPool = {
  connect: jest.fn(),
  end: jest.fn(),
  query: jest.fn(),
} as unknown as Pool;

// Datos de prueba que reflejan la estructura real de la base de datos
export const mockAuthUser = {
  id: uuidv4(),
  email: 'test@example.com',
};

export const mockCompany = {
  company_id: uuidv4(),
  company_name: 'Test Company',
  contact_email: 'company@example.com',
  phone: '1234567890',
  subscription_plan: 'STANDARD',
  registered_at: new Date(),
  status: 'ACTIVE',
  active_policy_id: null,
  metadata: {},
};

export const mockCompanyUser = {
  company_user_id: uuidv4(),
  company_id: mockCompany.company_id,
  auth_id: mockAuthUser.id,
  full_name: 'Test User',
  email: 'test@example.com',
  role: UserRole.ADMINISTRATOR,
  status: UserStatus.ACTIVE,
  metadata: {},
};

export const mockDataSubject = {
  data_subject_id: uuidv4(),
  auth_id: mockAuthUser.id,
  full_name: 'Test Data Subject',
  phone: '9876543210',
  status: 'ACTIVE',
  metadata: {},
};

export const mockLegalPolicy = {
  legal_policy_id: uuidv4(),
  company_id: mockCompany.company_id,
  version: '1.0',
  description: 'Test Legal Policy',
  valid_from: new Date(),
  valid_until: null,
  status: 'DRAFT',
  metadata: {},
};

export const mockConsent = {
  consent_id: uuidv4(),
  data_subject_id: mockDataSubject.data_subject_id,
  company_id: mockCompany.company_id,
  legal_policy_id: mockLegalPolicy.legal_policy_id,
  channel: 'EMAIL',
  purpose: 'Marketing Communications',
  status: 'ACCEPTED',
  consented_at: new Date(),
  expires_at: null,
  pdf_url: null,
  metadata: {},
};

export const mockDataType = {
  data_type_id: uuidv4(),
  name: 'Email Address',
  description: 'User email address',
  status: 'ACTIVE',
};

export const mockConsentDataType = {
  consent_id: mockConsent.consent_id,
  data_type_id: mockDataType.data_type_id,
  status: 'ACTIVE',
};

export const mockAuditLog = {
  audit_id: uuidv4(),
  company_user_id: mockCompanyUser.company_user_id,
  data_subject_id: mockDataSubject.data_subject_id,
  action: 'CONSENT_CREATED',
  ip_address: '127.0.0.1',
  action_at: new Date(),
  details: {},
};

// Funciones de utilidad para configurar mocks
export function setupSupabaseMocks() {
  // Reset todos los mocks
  jest.clearAllMocks();

  // Mock de createClient de Supabase
  jest.spyOn(require('@supabase/supabase-js'), 'createClient')
    .mockReturnValue(mockSupabaseClient as unknown as SupabaseClient);

  // Mock de drizzle
  jest.spyOn(require('drizzle-orm/node-postgres'), 'drizzle')
    .mockReturnValue(mockDrizzleClient as unknown as any);

  // Mock de Pool
  jest.spyOn(require('pg'), 'Pool')
    .mockImplementation(() => mockPool);
}

// Funciones de utilidad para verificar llamadas
export function expectSupabaseQuery(table: string, operation: string) {
  expect(mockSupabaseClient.from).toHaveBeenCalledWith(table);
  expect(mockSupabaseClient[operation]).toHaveBeenCalled();
}

export function expectDrizzleQuery(table: string, operation: string) {
  expect(mockDrizzleClient.from).toHaveBeenCalledWith(table);
  expect(mockDrizzleClient[operation]).toHaveBeenCalled();
}

// Función para crear datos de prueba relacionados
export function createRelatedTestData() {
  return {
    authUser: mockAuthUser,
    company: mockCompany,
    companyUser: mockCompanyUser,
    dataSubject: mockDataSubject,
    legalPolicy: mockLegalPolicy,
    consent: mockConsent,
    dataType: mockDataType,
    consentDataType: mockConsentDataType,
    auditLog: mockAuditLog,
  };
} 