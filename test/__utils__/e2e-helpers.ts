import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { createAuthFixture, UserFixture } from '../__fixtures__/user.fixture';

/**
 * Configurar la aplicación NestJS para pruebas E2E
 */
export const setupE2ETestApp = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  
  return app;
};

/**
 * Crear un token de autenticación para pruebas
 */
export const createMockToken = (userId: string = ''): string => {
  const auth = createAuthFixture({ 
    user: userId ? { id: userId } as Partial<UserFixture> : undefined
  });
  return `Bearer ${auth.session.access_token}`;
};

/**
 * Utilidad para realizar peticiones HTTP autenticadas
 */
export const authenticatedRequest = (
  app: INestApplication, 
  token: string = createMockToken()
) => {
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
        
    delete: (url: string) => 
      request(app.getHttpServer())
        .delete(url)
        .set('Authorization', token),
  };
};

/**
 * Utilidad para mockear respuestas de Supabase en pruebas E2E
 */
export const mockSupabaseE2E = (mockSupabaseClient: any, userId: string) => {
  // Mock para verificar el token
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: `test-${userId.slice(0, 8)}@example.com`,
        user_metadata: { name: `Test User ${userId.slice(0, 5)}` },
      },
    },
    error: null,
  });
  
  return mockSupabaseClient;
}; 