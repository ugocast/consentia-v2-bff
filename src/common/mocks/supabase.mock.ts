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
  from: any;
  select: any;
  insert: any;
  update: any;
  delete: any;
  limit: any;
  where: any;
  values: any;
  returning: any;
  execute: any;
  single: any;
  order: any;
  range: any;
  count: any;
  eq: any;
  neq: any;
  is: any;
  in: any;
  gte: any;
  lte: any;
  contains: any;
  then?: any;
  auth: {
    signUp: any;
    signInWithPassword: any;
    signOut: any;
    getUser: any;
    setSession: any;
    resetPasswordForEmail: any;
    updateUser: any;
    refreshSession: any;
  };
  // Propiedades adicionales para compatibilidad con SupabaseClient
  supabaseUrl?: string;
  supabaseKey?: string;
  realtime?: any;
  realtimeUrl?: string;
  authUrl?: string;
  storageUrl?: string;
  functionsUrl?: string;
  rest?: any;
  // Otras propiedades adicionales para compatibilidad con SupabaseClient
  storageKey?: string;
  headers?: any;
  schema?: any;
  getChannels?: any;
  removeChannel?: any;
  removeAllChannels?: any;
  listBuckets?: any;
  fetchRelease?: any;
  // Otras propiedades adicionales
  channel?: any;
  storage?: any;
  rpc?: any;
  functions?: any;
  queryBuilder?: any;
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
  // Limpiar todos los mocks
  Object.keys(mockSupabaseClient).forEach((key) => {
    if (key === 'auth') {
      Object.keys(mockSupabaseClient.auth).forEach((authKey) => {
        mockSupabaseClient.auth[authKey].mockReset();
      });
    } else if (typeof mockSupabaseClient[key] === 'function') {
      mockSupabaseClient[key].mockClear();
    }
  });

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
