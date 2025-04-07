import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { mockSupabaseClient } from '../src/common/mocks/supabase.mock';
import * as supabaseConfig from '../src/config/supabase.config';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { CompanyUserRole, CompanyUserStatus } from '../src/company-users/dto';

// Mock authentication guards
class MockAuthGuard {
  canActivate = jest.fn().mockImplementation(() => true);
}

jest.mock('../src/config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('CompanyUsersController (e2e)', () => {
  let app: INestApplication;

  // Mock data
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockAdminId = 'admin-123';

  const mockCompanyUser = {
    id: mockUserId,
    company_id: mockCompanyId,
    auth_id: 'auth-123',
    full_name: 'Test User',
    email: 'test@example.com',
    role: CompanyUserRole.OPERATOR,
    status: CompanyUserStatus.ACTIVE,
    metadata: { department: 'IT' },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    created_by: mockAdminId
  };

  const mockCreateDto = {
    email: 'new@example.com',
    fullName: 'New User',
    authId: 'auth-456',
    role: CompanyUserRole.OPERATOR,
    metadata: { department: 'Sales' }
  };

  const mockUpdateDto = {
    fullName: 'Updated User',
    metadata: { department: 'Marketing' }
  };

  const mockStatusDto = {
    status: CompanyUserStatus.SUSPENDED
  };

  const mockRoleDto = {
    role: CompanyUserRole.MANAGER
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configure mock to return the Supabase client
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(
      mockSupabaseClient,
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/companies/:companyId/users (POST)', () => {
    it('should create a new company user', () => {
      // Mock para crear usuario
      mockSupabaseClient.from().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCompanyUser,
            error: null,
          }),
        }),
      });

      return request(app.getHttpServer())
        .post(`/companies/${mockCompanyId}/users`)
        .send(mockCreateDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.companyId).toBe(mockCompanyId);
          expect(res.body.email).toBe(mockCreateDto.email);
          expect(res.body.fullName).toBe(mockCreateDto.fullName);
          expect(res.body.role).toBe(mockCreateDto.role);
        });
    });
  });

  describe('/companies/:companyId/users (GET)', () => {
    it('should return all users for a company', () => {
      // Mock para listar usuarios
      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: [mockCompanyUser],
        error: null,
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/users`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].id).toBe(mockUserId);
          expect(res.body[0].companyId).toBe(mockCompanyId);
        });
    });

    it('should include deleted users when includeDeleted is true', () => {
      // Mock para listar usuarios con eliminados
      mockSupabaseClient.from().select().order.mockResolvedValue({
        data: [
          mockCompanyUser, 
          {...mockCompanyUser, id: 'deleted-user', status: CompanyUserStatus.DELETED}
        ],
        error: null,
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/users`)
        .query({ includeDeleted: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBe(2);
          expect(res.body.some(user => user.status === CompanyUserStatus.DELETED)).toBe(true);
        });
    });
  });

  describe('/companies/:companyId/users/:id (GET)', () => {
    it('should return a specific company user', () => {
      // Mock para obtener un usuario
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: mockCompanyUser,
        error: null,
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/users/${mockUserId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockUserId);
          expect(res.body.companyId).toBe(mockCompanyId);
          expect(res.body.email).toBe(mockCompanyUser.email);
        });
    });

    it('should return 404 when user not found', () => {
      // Mock para usuario no encontrado
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/users/non-existent-id`)
        .expect(404);
    });
  });

  describe('/companies/:companyId/users/:id (PATCH)', () => {
    it('should update a company user', () => {
      // Mock para findOne
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockCompanyUser,
        error: null,
      });

      // Mock para update
      mockSupabaseClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              ...mockCompanyUser,
              full_name: 'Updated User',
              metadata: { department: 'Marketing' },
            },
            error: null,
          }),
        }),
      });

      return request(app.getHttpServer())
        .patch(`/companies/${mockCompanyId}/users/${mockUserId}`)
        .send(mockUpdateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockUserId);
          expect(res.body.fullName).toBe('Updated User');
          expect(res.body.metadata.department).toBe('Marketing');
        });
    });
  });

  describe('/companies/:companyId/users/:id/status (PATCH)', () => {
    it('should change user status', () => {
      // Mock para findOne
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockCompanyUser,
        error: null,
      });

      // Mock para update status
      mockSupabaseClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              ...mockCompanyUser,
              status: CompanyUserStatus.SUSPENDED,
            },
            error: null,
          }),
        }),
      });

      return request(app.getHttpServer())
        .patch(`/companies/${mockCompanyId}/users/${mockUserId}/status`)
        .send(mockStatusDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockUserId);
          expect(res.body.status).toBe(CompanyUserStatus.SUSPENDED);
        });
    });
  });

  describe('/companies/:companyId/users/:id/role (PATCH)', () => {
    it('should change user role', () => {
      // Mock para findOne
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockCompanyUser,
        error: null,
      });

      // Mock para update role
      mockSupabaseClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              ...mockCompanyUser,
              role: CompanyUserRole.MANAGER,
            },
            error: null,
          }),
        }),
      });

      return request(app.getHttpServer())
        .patch(`/companies/${mockCompanyId}/users/${mockUserId}/role`)
        .send(mockRoleDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockUserId);
          expect(res.body.role).toBe(CompanyUserRole.MANAGER);
        });
    });
  });

  describe('/companies/:companyId/users/:id (DELETE)', () => {
    it('should delete a company user', () => {
      // Mock para findOne
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockCompanyUser,
        error: null,
      });

      // Mock para update (soft delete)
      mockSupabaseClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      return request(app.getHttpServer())
        .delete(`/companies/${mockCompanyId}/users/${mockUserId}`)
        .expect(204);
    });
  });

  afterAll(async () => {
    await app.close();
  });
}); 