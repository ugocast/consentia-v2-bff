import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { mockSupabaseClient } from '../src/common/mocks/supabase.mock';
import * as supabaseConfig from '../src/config/supabase.config';
import { ExternalIntegrationStatus } from '../src/external-integrations/dto';
import { JwtAuthGuard } from '../src/auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

// Mock authentication guards
class MockAuthGuard {
  canActivate = jest.fn().mockImplementation(() => true);
}

jest.mock('../src/config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('ExternalIntegrationsController (e2e)', () => {
  let app: INestApplication;

  const mockExternalIntegration = {
    id: 'test-integration-id',
    company_id: 'test-company-id',
    name: 'Test Integration',
    type: 'CRM',
    endpoint: 'https://example.com/api',
    api_key: 'api-key-123',
    status: ExternalIntegrationStatus.ACTIVE,
    metadata: { webhookUrl: 'https://example.com/webhook' },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    created_by: 'user-123',
  };

  const mockCreateDto = {
    name: 'Test Integration',
    type: 'CRM',
    endpoint: 'https://example.com/api',
    apiKey: 'api-key-123',
    metadata: { webhookUrl: 'https://example.com/webhook' },
  };

  const mockUpdateDto = {
    name: 'Updated Integration',
    endpoint: 'https://example.com/api/v2',
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

  describe('/external-integrations (POST)', () => {
    it('should create a new external integration', () => {
      mockSupabaseClient.from().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockExternalIntegration,
            error: null,
          }),
        }),
      });

      return request(app.getHttpServer())
        .post('/external-integrations')
        .query({ companyId: 'test-company-id' })
        .send(mockCreateDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(mockCreateDto.name);
          expect(res.body.type).toBe(mockCreateDto.type);
          expect(res.body.companyId).toBe('test-company-id');
        });
    });
  });

  describe('/external-integrations (GET)', () => {
    it('should return all external integrations for a company', () => {
      mockSupabaseClient.from().select.mockResolvedValue({
        data: [mockExternalIntegration],
        error: null,
      });

      return request(app.getHttpServer())
        .get('/external-integrations')
        .query({ companyId: 'test-company-id' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].id).toBe(mockExternalIntegration.id);
          expect(res.body[0].name).toBe(mockExternalIntegration.name);
        });
    });
  });

  describe('/external-integrations/:id (GET)', () => {
    it('should return a specific external integration by ID', () => {
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: mockExternalIntegration,
        error: null,
      });

      return request(app.getHttpServer())
        .get(`/external-integrations/${mockExternalIntegration.id}`)
        .query({ companyId: 'test-company-id' })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockExternalIntegration.id);
          expect(res.body.name).toBe(mockExternalIntegration.name);
          expect(res.body.type).toBe(mockExternalIntegration.type);
        });
    });

    it('should return 404 when integration not found', () => {
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      return request(app.getHttpServer())
        .get('/external-integrations/non-existent-id')
        .query({ companyId: 'test-company-id' })
        .expect(404);
    });
  });

  describe('/external-integrations/:id (PUT)', () => {
    it('should update an external integration', () => {
      // Mock for findOne call
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockExternalIntegration,
        error: null,
      });

      // Mock for update call
      mockSupabaseClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              ...mockExternalIntegration,
              name: 'Updated Integration',
              endpoint: 'https://example.com/api/v2',
            },
            error: null,
          }),
        }),
      });

      return request(app.getHttpServer())
        .put(`/external-integrations/${mockExternalIntegration.id}`)
        .query({ companyId: 'test-company-id' })
        .send(mockUpdateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockExternalIntegration.id);
          expect(res.body.name).toBe('Updated Integration');
          expect(res.body.endpoint).toBe('https://example.com/api/v2');
        });
    });
  });

  describe('/external-integrations/:id (DELETE)', () => {
    it('should delete an external integration', () => {
      // Mock for findOne call
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockExternalIntegration,
        error: null,
      });

      // Mock for update call (soft delete)
      mockSupabaseClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      return request(app.getHttpServer())
        .delete(`/external-integrations/${mockExternalIntegration.id}`)
        .query({ companyId: 'test-company-id' })
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
}); 