import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { jest } from '@jest/globals';

// Tipos para los mocks de Drizzle
interface MockDrizzleClient {
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
}

// Crear mocks para las tablas definidas en el schema
export const mockDrizzleTables = {
  authUser: jest.fn(),
  legalPolicy: jest.fn(),
  company: jest.fn(),
  companyConfiguration: jest.fn(),
  externalIntegration: jest.fn(),
  companyUser: jest.fn(),
  userActiveCompany: jest.fn(),
  dataSubject: jest.fn(),
  consent: jest.fn(),
  dataType: jest.fn(),
  consentDataType: jest.fn(),
  auditLog: jest.fn(),
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
  execute: jest.fn().mockImplementation(() => Promise.resolve([])),
  transaction: jest.fn(),
};

// Mock de Pool
export const mockPool = {
  connect: jest.fn(),
  end: jest.fn(),
  query: jest.fn(),
} as unknown as Pool;

// Función para configurar el resultado de una consulta
export function setupDrizzleQueryResult<T>(result: T | T[]) {
  const resultArray = Array.isArray(result) ? result : [result];
  mockDrizzleClient.execute.mockImplementation(() => Promise.resolve(resultArray));
  return mockDrizzleClient;
}

// Función para configurar el resultado de una transacción
export function setupDrizzleTransaction<T>(result: T | T[]) {
  const resultArray = Array.isArray(result) ? result : [result];
  mockDrizzleClient.transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
    const tx = {
      insert: jest.fn().mockImplementation(() => Promise.resolve(resultArray)),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
    };
    return callback(tx);
  });
  return mockDrizzleClient;
}

// Función para resetear los mocks
export function resetDrizzleMocks() {
  jest.clearAllMocks();
  mockDrizzleClient.execute.mockImplementation(() => Promise.resolve([]));
}

// Función para verificar una consulta
export function expectDrizzleQuery(table: string, operation: string) {
  expect(mockDrizzleClient.from).toHaveBeenCalledWith(table);
  expect(mockDrizzleClient[operation as keyof MockDrizzleClient]).toHaveBeenCalled();
}

// Mock de la función drizzle
export const mockDrizzle = jest.fn(() => mockDrizzleClient as unknown as ReturnType<typeof drizzle>);

// Reemplazar la implementación real de drizzle
jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mockDrizzle,
  eq,
})); 