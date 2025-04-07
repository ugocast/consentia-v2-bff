/**
 * Mocks específicos para Supabase en pruebas E2E
 */

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    admin: {
      getUserById: jest.fn(),
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
      listUsers: jest.fn(),
      createUser: jest.fn(),
      inviteUserByEmail: jest.fn(),
    },
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn(),
  in: jest.fn(),
  match: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  lt: jest.fn(),
  gt: jest.fn(),
  like: jest.fn(),
  ilike: jest.fn(),
  or: jest.fn(),
  and: jest.fn(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  range: jest.fn().mockReturnThis(),
};

export const mockCreateSupabaseClient = jest.fn();

/**
 * Configurar respuestas de Supabase para pruebas E2E
 */
export const setupMockUser = (userId: string, email: string = `test-${userId}@example.com`, name: string = `Test User ${userId}`) => {
  const mockUser = {
    id: userId,
    email,
    user_metadata: { name },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  // Mock para verificación de token
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });

  // Mock para obtener usuario por ID
  mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });

  return mockUser;
};

/**
 * Mock para usuarios no autenticados
 */
export const setupUnauthenticatedUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Invalid token' },
  });
}; 