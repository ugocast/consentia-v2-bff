import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { mockSupabaseClient } from '../src/common/mocks/supabase.mock';
import * as supabaseConfig from '../src/config/supabase.config';
import { testCleanup } from './__utils__/test-cleanup';
import { authenticatedApiRequest } from './__utils__/auth-helpers';
import { responseValidators } from './__utils__/response-validators';
import { setupMockUser } from './__mocks__/supabase.mock';
import { createUserFixture } from './__fixtures__/user.fixture';

jest.mock('../src/config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configurar el mock para devolver el cliente de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(
      mockSupabaseClient,
    );

    // Mock para verificar el token (lo mantenemos para compatibilidad)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
        },
      },
      error: null,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Configurar limpieza automática en lugar de afterAll manual
  afterEach(() => testCleanup.resetAllMocks());
  afterAll(async () => await testCleanup.closeApp(app));

  describe('/users/me (GET)', () => {
    it('should get current user profile', async () => {
      // Arrange - Preparar datos de prueba usando fixtures
      const userId = 'test-user-id';
      const user = createUserFixture({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
      
      // Configurar respuesta de Supabase usando las utilidades
      setupMockUser(userId, user.email, user.name);
      
      // Crear cliente API autenticado
      const api = authenticatedApiRequest(app, userId);
      
      // Act - Realizar la petición
      const response = await api.get('/users/me');
      
      // Assert - Validar la respuesta usando los validadores
      expect(response.status).toBe(200);
      const userData = responseValidators.validateUserResponse(response.body);
      
      // Verificar los datos específicos
      expect(userData.email).toBe(user.email);
      expect(userData.name).toBe(user.name);
    });

    it('should return 401 when token is invalid', async () => {
      // Arrange - Configurar una petición sin autenticación válida
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });
      
      // Act & Assert - Realizar la petición y validar error
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token');
      
      // Validar la estructura del error
      expect(response.status).toBe(401);
      responseValidators.validateErrorResponse(response, 401);
    });
  });
});
