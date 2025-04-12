import { jest } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Tipos específicos para las respuestas de Supabase
 */
export interface SupabaseResponse<T = any> {
  data: T | null;
  error: { message: string } | null;
  count?: number;
}

// Tipos para los mocks de Supabase
export interface MockSupabaseClient {
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
  single: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  count: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  is: jest.Mock;
  in: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  contains: jest.Mock;
  auth: {
    signUp: jest.Mock;
    signInWithPassword: jest.Mock;
    signOut: jest.Mock;
    getUser: jest.Mock;
    setSession: jest.Mock;
    resetPasswordForEmail: jest.Mock;
    updateUser: jest.Mock;
    refreshSession: jest.Mock;
    verifyOtp: jest.Mock;
    admin: {
      getUserById: jest.Mock;
      updateUserById: jest.Mock;
      deleteUser: jest.Mock;
      listUsers: jest.Mock;
      createUser: jest.Mock;
      inviteUserByEmail: jest.Mock;
      generateLink: jest.Mock;
    };
  };
  // Propiedades de compatibilidad
  supabaseUrl: string;
  supabaseKey: string;
  realtime: Record<string, any>;
  realtimeUrl: string;
  authUrl: string;
  storageUrl: string;
  functionsUrl: string;
  rest: Record<string, any>;
  storageKey: string;
  headers: Record<string, any>;
  schema: string;
  getChannels: jest.Mock;
  removeChannel: jest.Mock;
  removeAllChannels: jest.Mock;
  listBuckets: jest.Mock;
  fetchRelease: jest.Mock;
  // Otras propiedades
  channel: Record<string, any>;
  storage: Record<string, any>;
  rpc: jest.Mock;
  functions: Record<string, any>;
  queryBuilder: Record<string, any>;
}

// Cliente mock de Supabase
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
  single: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  count: jest.fn(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    setSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    refreshSession: jest.fn(),
    verifyOtp: jest.fn(),
    admin: {
      getUserById: jest.fn(),
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
      listUsers: jest.fn(),
      createUser: jest.fn(),
      inviteUserByEmail: jest.fn(),
      generateLink: jest.fn(),
    },
  },
  // Valores para las propiedades de compatibilidad
  supabaseUrl: 'https://example.com',
  supabaseKey: 'test-key',
  realtime: {},
  realtimeUrl: 'wss://example.com',
  authUrl: 'https://example.com/auth',
  storageUrl: 'https://example.com/storage',
  functionsUrl: 'https://example.com/functions',
  rest: {},
  // Propiedades adicionales de compatibilidad
  storageKey: 'test-storage-key',
  headers: {},
  schema: 'public',
  getChannels: jest.fn(),
  removeChannel: jest.fn(),
  removeAllChannels: jest.fn(),
  listBuckets: jest.fn(),
  fetchRelease: jest.fn(),
  // Valores para otras propiedades
  channel: {},
  storage: {},
  rpc: jest.fn().mockReturnThis(),
  functions: {},
  queryBuilder: {},
};

// Funciones de utilidad para configurar resultados
export function setupSupabaseQueryResult(data: any, error: any = null) {
  mockSupabaseClient.execute.mockImplementation(() => Promise.resolve({ data, error }));
}

export function setupSupabaseError(error: any) {
  mockSupabaseClient.execute.mockImplementation(() => Promise.resolve({ data: null, error }));
}

// Función para resetear los mocks
export function resetSupabaseMocks() {
  Object.values(mockSupabaseClient).forEach((value) => {
    if (value && typeof value === 'object' && value.mockReset) {
      value.mockReset();
    }
  });

  // Resetear auth y sus métodos
  Object.values(mockSupabaseClient.auth).forEach((method) => {
    if (method && typeof method === 'object' && method.mockReset) {
      method.mockReset();
    }
  });

  // Resetear auth.admin y sus métodos
  if (mockSupabaseClient.auth.admin) {
    Object.values(mockSupabaseClient.auth.admin).forEach((method) => {
      if (method && typeof method === 'function' && method.mockReset) {
        method.mockReset();
      }
    });
  }

  // Restablecer comportamiento por defecto
  mockSupabaseClient.from.mockReturnThis();
  mockSupabaseClient.select.mockReturnThis();
  mockSupabaseClient.insert.mockReturnThis();
  mockSupabaseClient.update.mockReturnThis();
  mockSupabaseClient.delete.mockReturnThis();
  mockSupabaseClient.limit.mockReturnThis();
  mockSupabaseClient.where.mockReturnThis();
  mockSupabaseClient.values.mockReturnThis();
  mockSupabaseClient.returning.mockReturnThis();
  mockSupabaseClient.single.mockReturnThis();
  mockSupabaseClient.order.mockReturnThis();
  mockSupabaseClient.range.mockReturnThis();
  mockSupabaseClient.eq.mockReturnThis();
  mockSupabaseClient.neq.mockReturnThis();
  mockSupabaseClient.is.mockReturnThis();
  mockSupabaseClient.in.mockReturnThis();
  mockSupabaseClient.gte.mockReturnThis();
  mockSupabaseClient.lte.mockReturnThis();
  mockSupabaseClient.contains.mockReturnThis();
  
  // Usar implementaciones en lugar de ResolvedValue
  mockSupabaseClient.execute.mockImplementation(() => Promise.resolve({ data: [], error: null }));
  mockSupabaseClient.count.mockImplementation(() => Promise.resolve({ data: [], error: null }));
}

// Función para verificar una consulta
export function expectSupabaseQuery(table: string, operation: string) {
  expect(mockSupabaseClient.from).toHaveBeenCalledWith(table);
  expect(mockSupabaseClient[operation as keyof MockSupabaseClient]).toHaveBeenCalled();
}

// Mock de la función createClient con tipado explícito para evitar errores
export const mockCreateSupabaseClient = jest.fn(() => mockSupabaseClient as unknown as SupabaseClient<any, "public", any>);

// Reemplazar la implementación real de createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateSupabaseClient,
}));
