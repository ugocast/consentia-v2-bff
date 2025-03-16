import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { mockSupabaseClient } from '../src/common/mocks/supabase.mock';
import * as supabaseConfig from '../src/config/supabase.config';

jest.mock('../src/config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configurar el mock para devolver el cliente de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(
      mockSupabaseClient,
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const mockUser = {
        id: 'user-id',
        email: registerDto.email,
        user_metadata: { name: registerDto.name },
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('session');
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.user_metadata.name).toBe(registerDto.name);
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login a user', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('session');
          expect(res.body.user.email).toBe(loginDto.email);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
