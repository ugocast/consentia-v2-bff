import { User } from '../decorators/current-user.decorator';

/**
 * Mock de un usuario autenticado a través de Supabase Auth
 * Útil para pruebas de componentes que utilizan el decorador @CurrentUser()
 */
export const mockUser: User = {
  id: 'mock-user-id',
  email: 'mock-user@example.com',
  user_metadata: {
    name: 'Mock User',
    onboarding_status: 'COMPLETED',
    company_id: 'mock-company-id',
    roles: ['ADMIN']
  },
  created_at: new Date().toISOString(),
  app_metadata: {
    provider: 'email',
    providers: ['email']
  }
};

/**
 * Mock de un request con usuario autenticado
 * Útil para pruebas de guards y middlewares
 */
export const mockRequestWithUser = {
  user: { ...mockUser },
  headers: {
    authorization: 'Bearer mock-token'
  },
  method: 'GET',
  url: '/api/test',
  params: {},
  query: {}
};

/**
 * Mock de información de usuario para controladores que utilizan @CurrentUser()
 * @param overrides - Propiedades que sobrescriben los valores por defecto
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    ...mockUser,
    ...overrides
  };
}

/**
 * Mock del decorador CurrentUser para pruebas de controladores
 * @param propertyPath - Ruta de propiedad a extraer, similar al decorador real
 * @param mockData - Datos de usuario mock
 */
export function mockCurrentUser(propertyPath?: string, mockData: User = mockUser) {
  // Si no se especifica propiedad, devolver el usuario completo
  if (!propertyPath) {
    return () => mockData;
  }

  // Si se especifica una propiedad anidada (con notación de punto)
  if (propertyPath.includes('.')) {
    const parts = propertyPath.split('.');
    let value = mockData as any;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return () => undefined;
      }
      value = value[part];
    }
    
    return () => value;
  }

  // Si es una propiedad simple
  return () => (mockData as any)[propertyPath];
} 