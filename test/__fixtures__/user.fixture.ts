import { v4 as uuidv4 } from 'uuid';

/**
 * Factory function para crear datos de usuario para pruebas
 */
export const createUserFixture = (overrides: Partial<UserFixture> = {}): UserFixture => {
  const id = overrides.id || uuidv4();
  
  return {
    id,
    email: overrides.email || `test-${id.slice(0, 8)}@example.com`,
    name: overrides.name || `Test User ${id.slice(0, 5)}`,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    ...overrides
  };
};

/**
 * Factory function para crear datos de autenticación para pruebas
 */
export const createAuthFixture = (overrides: Partial<AuthFixtureInput> = {}): AuthFixture => {
  const userId = overrides.user?.id || uuidv4();
  
  // Asegurar que el objeto user tiene todas las propiedades requeridas
  const user = overrides.user ? createUserFixture(overrides.user) : createUserFixture({ id: userId });
  
  // Asegurar que el objeto session tiene todas las propiedades requeridas
  const session = {
    access_token: (overrides.session?.access_token !== undefined) 
      ? overrides.session.access_token 
      : `fake-token-${userId.slice(0, 8)}`,
    refresh_token: (overrides.session?.refresh_token !== undefined) 
      ? overrides.session.refresh_token 
      : `fake-refresh-${userId.slice(0, 8)}`,
    expires_at: (overrides.session?.expires_at !== undefined) 
      ? overrides.session.expires_at 
      : Math.floor(Date.now() / 1000) + 3600,
    ...(overrides.session || {})
  };

  return {
    user,
    session,
    ...overrides
  };
};

/**
 * Crear múltiples usuarios para pruebas
 */
export const createManyUserFixtures = (count: number, overrides: Partial<UserFixture> = {}): UserFixture[] => {
  return Array.from({ length: count }, (_, index) => 
    createUserFixture({ 
      ...overrides,
      email: overrides.email || `test-user-${index}@example.com`,
      name: overrides.name || `Test User ${index}`
    })
  );
};

/**
 * Interfaces para los fixtures
 */
export interface UserFixture {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface AuthFixture {
  user: UserFixture;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface AuthFixtureInput {
  user?: Partial<UserFixture>;
  session?: Partial<{
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
} 