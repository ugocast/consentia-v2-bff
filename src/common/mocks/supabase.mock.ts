import { jest } from '@jest/globals';

// Definir interfaces para los tipos de respuesta de Supabase
interface SupabaseResponse<T = any> {
  data: T | null;
  error: { message: string } | null;
  count?: number;
}

// Interfaces para los tipos de autenticación
interface AuthResponse {
  data: {
    user: any;
    session: any;
  } | null;
  error: { message: string } | null;
}

interface UserResponse {
  data: {
    user: any;
  } | null;
  error: { message: string } | null;
}

interface SignOutResponse {
  error: { message: string } | null;
}

interface AdminUserResponse {
  data: {
    user: any;
  } | null;
  error: { message: string } | null;
}

// Crear un mock para el cliente de Supabase
export const mockSupabaseClient = {
  auth: {
    signUp: jest.fn<() => Promise<AuthResponse>>().mockImplementation(() =>
      Promise.resolve({
        data: { user: null, session: null },
        error: null,
      }),
    ),
    signInWithPassword: jest
      .fn<() => Promise<AuthResponse>>()
      .mockImplementation(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: null,
        }),
      ),
    signOut: jest
      .fn<() => Promise<SignOutResponse>>()
      .mockImplementation(() => Promise.resolve({ error: null })),
    resetPasswordForEmail: jest
      .fn<() => Promise<SignOutResponse>>()
      .mockImplementation(() => Promise.resolve({ error: null })),
    updateUser: jest
      .fn<() => Promise<SignOutResponse>>()
      .mockImplementation(() => Promise.resolve({ error: null })),
    getUser: jest
      .fn<() => Promise<UserResponse>>()
      .mockImplementation(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      ),
    refreshSession: jest
      .fn<() => Promise<AuthResponse>>()
      .mockImplementation(() =>
        Promise.resolve({
          data: { user: null, session: null },
          error: null,
        }),
      ),
    setSession: jest.fn(),
    admin: {
      getUserById: jest
        .fn<() => Promise<AdminUserResponse>>()
        .mockImplementation(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
      updateUserById: jest
        .fn<() => Promise<AdminUserResponse>>()
        .mockImplementation(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
      deleteUser: jest
        .fn<() => Promise<SignOutResponse>>()
        .mockImplementation(() => Promise.resolve({ error: null })),
    },
  },
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  neq: jest.fn(),
  gt: jest.fn(),
  gte: jest.fn(),
  lt: jest.fn(),
  lte: jest.fn(),
  in: jest.fn(),
  is: jest.fn(),
  order: jest.fn(),
  range: jest.fn().mockImplementation(() => {
    return {
      then: (callback) =>
        callback({
          data: [],
          error: null,
          count: 0,
        }),
    };
  }),
  single: jest.fn().mockImplementation(() => {
    return {
      then: (callback) =>
        callback({
          data: {},
          error: null,
        }),
    };
  }),
  count: jest.fn().mockImplementation(() => {
    return {
      then: (callback) =>
        callback({
          data: 0,
          error: null,
        }),
    };
  }),
  then: jest.fn(),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
    }),
  },
  rpc: jest.fn(),
};

// Asegurarse de que cada método devuelva el propio cliente para permitir encadenamiento
Object.keys(mockSupabaseClient).forEach((key) => {
  if (typeof mockSupabaseClient[key] === 'function' && key !== 'then') {
    mockSupabaseClient[key].mockReturnValue(mockSupabaseClient);
  }
});

// Mock para la función createSupabaseClient
export const mockCreateSupabaseClient = jest
  .fn()
  .mockReturnValue(mockSupabaseClient);

// Función auxiliar para configurar respuestas de Supabase
export function setupSupabaseResponse<T = any>(
  response: SupabaseResponse<T>,
): void {
  mockSupabaseClient.then.mockImplementation(() => Promise.resolve(response));
}

// Función auxiliar para configurar respuestas de error de Supabase
export function setupSupabaseError(errorMessage: string): void {
  setupSupabaseResponse({
    data: null,
    error: { message: errorMessage },
  });
}

// Función auxiliar para configurar respuestas de éxito de Supabase
export function setupSupabaseSuccess<T = any>(data: T): void {
  setupSupabaseResponse({
    data,
    error: null,
  });
}

// Función auxiliar para configurar respuestas de éxito con conteo
export function setupSupabaseSuccessWithCount<T = any>(
  data: T,
  count: number,
): void {
  setupSupabaseResponse({
    data,
    error: null,
    count,
  });
}

// Función auxiliar para resetear todos los mocks
export function resetSupabaseMocks(): void {
  jest.clearAllMocks();
  Object.keys(mockSupabaseClient).forEach((key) => {
    if (typeof mockSupabaseClient[key] === 'function') {
      mockSupabaseClient[key].mockClear();
    }
  });

  // Restaurar el comportamiento de encadenamiento
  Object.keys(mockSupabaseClient).forEach((key) => {
    if (typeof mockSupabaseClient[key] === 'function' && key !== 'then') {
      mockSupabaseClient[key].mockReturnValue(mockSupabaseClient);
    }
  });

  // Restaurar implementaciones por defecto para métodos de auth
  mockSupabaseClient.auth.signUp.mockImplementation(() =>
    Promise.resolve({
      data: { user: null, session: null },
      error: null,
    }),
  );
  mockSupabaseClient.auth.signInWithPassword.mockImplementation(() =>
    Promise.resolve({
      data: { user: null, session: null },
      error: null,
    }),
  );
  mockSupabaseClient.auth.signOut.mockImplementation(() =>
    Promise.resolve({ error: null }),
  );
  mockSupabaseClient.auth.resetPasswordForEmail.mockImplementation(() =>
    Promise.resolve({ error: null }),
  );
  mockSupabaseClient.auth.updateUser.mockImplementation(() =>
    Promise.resolve({ error: null }),
  );
  mockSupabaseClient.auth.getUser.mockImplementation(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  mockSupabaseClient.auth.refreshSession.mockImplementation(() =>
    Promise.resolve({
      data: { user: null, session: null },
      error: null,
    }),
  );
  mockSupabaseClient.auth.admin.getUserById.mockImplementation(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  mockSupabaseClient.auth.admin.updateUserById.mockImplementation(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  mockSupabaseClient.auth.admin.deleteUser.mockImplementation(() =>
    Promise.resolve({ error: null }),
  );
}

// Mock para el módulo de configuración de Supabase
jest.mock('../../config/supabase.config', () => ({
  createSupabaseClient: mockCreateSupabaseClient,
}));
