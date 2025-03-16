import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { mockSupabaseClient } from '../src/common/mocks/supabase.mock';
import * as supabaseConfig from '../src/config/supabase.config';

jest.mock('../src/config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  const userId = 'user-id';
  const mockToken = 'Bearer valid-token';

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Configurar el mock para devolver el cliente de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Mock para verificar el token
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { 
        user: {
          id: userId,
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
        }
      },
      error: null,
    });
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/users/me (GET)', () => {
    it('should get current user profile', () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', mockToken)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name');
          expect(res.body.email).toBe(mockUser.email);
          expect(res.body.name).toBe(mockUser.user_metadata.name);
        });
    });

    it('should return 401 when token is invalid', () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
}); 