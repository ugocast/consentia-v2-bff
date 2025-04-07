import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { mockSupabaseClient } from '../__mocks__/supabase.mock';
import { UserFixture, createUserFixture } from '../__fixtures__/user.fixture';
import { createCompanyFixture } from '../__fixtures__/company.fixture';

/**
 * Roles disponibles en la aplicación
 */
export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * Crear un token de autenticación con un usuario de prueba
 */
export const createAuthToken = (userId: string = uuidv4()): string => {
  return `Bearer test-token-${userId.slice(0, 8)}`;
};

/**
 * Configurar un usuario autenticado con Supabase
 */
export const setupAuthenticatedUser = (
  userId: string = uuidv4(), 
  userDetails: Partial<UserFixture> = {}
): UserFixture => {
  const user = createUserFixture({
    id: userId,
    ...userDetails
  });
  
  // Configurar respuesta para getUser
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { name: user.name },
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    },
    error: null,
  });
  
  // Configurar respuesta para getUserById
  mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { name: user.name },
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    },
    error: null,
  });
  
  return user;
};

/**
 * Configurar un usuario con rol específico en una compañía
 */
export const setupUserWithRole = (
  userId: string = uuidv4(),
  companyId: string = uuidv4(),
  role: UserRole = UserRole.MEMBER
) => {
  const user = setupAuthenticatedUser(userId);
  const company = createCompanyFixture({ id: companyId });
  
  // Configurar respuesta para consulta de rol
  mockSupabaseClient.from.mockReturnThis();
  mockSupabaseClient.select.mockReturnThis();
  mockSupabaseClient.eq.mockResolvedValue({
    data: [{
      user_id: userId,
      company_id: companyId,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    error: null,
  });
  
  return { user, company, role };
};

/**
 * Utilidad para realizar peticiones HTTP autenticadas con más opciones
 */
export const authenticatedApiRequest = (
  app: INestApplication,
  userId: string = uuidv4(),
  userDetails: Partial<UserFixture> = {},
  token: string = createAuthToken(userId)
) => {
  // Configurar el usuario en Supabase
  setupAuthenticatedUser(userId, userDetails);
  
  return {
    get: (url: string) => 
      request(app.getHttpServer())
        .get(url)
        .set('Authorization', token),
        
    post: (url: string, data?: any) => 
      request(app.getHttpServer())
        .post(url)
        .set('Authorization', token)
        .send(data),
        
    put: (url: string, data?: any) => 
      request(app.getHttpServer())
        .put(url)
        .set('Authorization', token)
        .send(data),
        
    patch: (url: string, data?: any) => 
      request(app.getHttpServer())
        .patch(url)
        .set('Authorization', token)
        .send(data),
        
    delete: (url: string) => 
      request(app.getHttpServer())
        .delete(url)
        .set('Authorization', token),
  };
}; 