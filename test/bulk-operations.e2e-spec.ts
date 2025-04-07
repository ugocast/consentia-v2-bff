import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, MiddlewareConsumer } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { CompanyContextMiddleware } from '../src/common/middleware/company-context.middleware';

// Mock authentication guards
class MockAuthGuard {
  canActivate = jest.fn().mockImplementation(() => true);
}

// Creamos un mock completo que simule la cadena de métodos de Supabase
const createQueryBuilder = () => {
  // Definimos builder primero
  const builder: any = {};
  
  // Ahora asignamos todos los métodos a builder
  builder.select = jest.fn().mockReturnValue(builder);
  builder.from = jest.fn().mockReturnValue(builder);
  builder.insert = jest.fn().mockReturnValue(builder);
  builder.update = jest.fn().mockReturnValue(builder);
  builder.delete = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.neq = jest.fn().mockReturnValue(builder);
  builder.gt = jest.fn().mockReturnValue(builder);
  builder.gte = jest.fn().mockReturnValue(builder);
  builder.lt = jest.fn().mockReturnValue(builder);
  builder.lte = jest.fn().mockReturnValue(builder);
  builder.like = jest.fn().mockReturnValue(builder);
  builder.ilike = jest.fn().mockReturnValue(builder);
  builder.is = jest.fn().mockReturnValue(builder);
  builder.in = jest.fn().mockReturnValue(builder);
  builder.contains = jest.fn().mockReturnValue(builder);
  builder.containedBy = jest.fn().mockReturnValue(builder);
  builder.range = jest.fn().mockReturnValue(builder);
  builder.overlaps = jest.fn().mockReturnValue(builder);
  builder.textSearch = jest.fn().mockReturnValue(builder);
  builder.match = jest.fn().mockReturnValue(builder);
  builder.not = jest.fn().mockReturnValue(builder);
  builder.or = jest.fn().mockReturnValue(builder);
  builder.and = jest.fn().mockReturnValue(builder);
  builder.filter = jest.fn().mockReturnValue(builder);
  builder.order = jest.fn().mockReturnValue(builder);
  builder.limit = jest.fn().mockReturnValue(builder);
  builder.offset = jest.fn().mockReturnValue(builder);
  builder.single = jest.fn();
  builder.maybeSingle = jest.fn();
  builder.all = jest.fn();
  builder.execute = jest.fn();
  builder.count = jest.fn().mockReturnValue({ data: 0, error: null });
  builder.then = jest.fn();
  builder.data = [];
  builder.error = null;
  
  return builder;
};

// Mock para el cliente Supabase Auth
const mockAuthClient = {
  getUser: jest.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        app_metadata: { roles: ['admin'] }
      }
    },
    error: null
  })
};

jest.mock('../src/config/supabase.config', () => ({
  createSupabaseClient: jest.fn(() => ({
    from: jest.fn(),
    auth: mockAuthClient
  })),
}));

// Mock Supabase client
const mockFrom = jest.fn();

describe('BulkOperationsController (e2e)', () => {
  let app: INestApplication;
  // Mock token para simular autenticación
  const mockAuthToken = 'test-auth-token';

  // Mock data
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockBulkOpId = 'bulkop-123';

  const mockBulkOperation = {
    id: mockBulkOpId,
    type: 'create_consent',
    items: [{ dataSubjectId: 'subject-1' }],
    status: 'PENDING',
    created_at: '2023-01-01T00:00:00Z',
    created_by: mockUserId,
    company_id: mockCompanyId,
    metadata: { source: 'csv-import' },
    description: 'Test bulk operation'
  };

  const mockCreateDto = {
    type: 'create_consent',
    items: [{ dataSubjectId: 'subject-1' }],
    metadata: { source: 'csv-import' },
    description: 'Test bulk operation'
  };

  const mockUpdateDto = {
    metadata: { source: 'updated-source' }
  };

  const mockProcessDto = {
    metadata: { dryRun: false },
    comments: 'Processing bulk operation'
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configuramos los mocks para evitar errores
    mockFrom.mockImplementation(() => {
      const queryBuilder = createQueryBuilder();
      
      // Para los diferentes endpoints, retornamos diferentes datos
      queryBuilder.all.mockImplementation(() => {
        return Promise.resolve({
          data: [],
          error: null
        });
      });
      
      return queryBuilder;
    });

    // Mock para verificar permisos de usuario en una empresa
    mockFrom.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              role: 'admin',
              permissions: ['bulk_operations:create', 'bulk_operations:read', 'bulk_operations:update', 'bulk_operations:delete']
            },
            error: null
          })
        })
      })
    }));

    // Actualiza la referencia al mock de Supabase
    const supabase = require('../src/config/supabase.config');
    supabase.createSupabaseClient.mockReturnValue({
      from: mockFrom,
      auth: mockAuthClient
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Aplicamos el middleware mock directamente
    app.use((req, res, next) => {
      req.companyContext = {
        companyId: mockCompanyId,
        companyName: 'Test Company',
        roles: ['admin'],
        permissions: ['bulk_operations:create', 'bulk_operations:read', 'bulk_operations:update', 'bulk_operations:delete']
      };
      next();
    });
    
    await app.init();
  });

  describe('/companies/:companyId/bulk-operations (POST)', () => {
    it('should create a new bulk operation', () => {
      // Mock para crear operación
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para insert y select
        queryBuilder.insert.mockImplementation(() => {
          return {
            select: () => ({
              single: () => Promise.resolve({
                data: mockBulkOperation,
                error: null,
              }),
            }),
          };
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .post(`/companies/${mockCompanyId}/bulk-operations`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(mockCreateDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe(mockCreateDto.type);
          expect(res.body.company_id).toBe(mockCompanyId);
        });
    });
  });

  describe('/companies/:companyId/bulk-operations/:id/process (POST)', () => {
    it('should process a bulk operation', () => {
      // Mock para findOne y update
      mockFrom.mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para select y single
        queryBuilder.single.mockImplementation(() => {
          return Promise.resolve({
            data: mockBulkOperation,
            error: null,
          });
        });
        
        return queryBuilder;
      }).mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para update
        const processedOperation = {
          ...mockBulkOperation,
          status: 'PROCESSING'
        };
        
        queryBuilder.update.mockImplementation(() => {
          return {
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: processedOperation,
                  error: null,
                }),
              }),
            }),
          };
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .post(`/companies/${mockCompanyId}/bulk-operations/${mockBulkOpId}/process`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(mockProcessDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockBulkOpId);
          expect(res.body.status).toBe('PROCESSING');
        });
    });
  });

  describe('/companies/:companyId/bulk-operations (GET)', () => {
    it('should return all bulk operations', () => {
      // Mock para listar operaciones
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para order
        queryBuilder.order.mockImplementation(() => {
          return Promise.resolve({
            data: [mockBulkOperation],
            error: null,
          });
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/bulk-operations`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].id).toBe(mockBulkOpId);
        });
    });

    it('should filter by status and type', () => {
      // Mock para listar operaciones filtradas
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para order con filtros
        queryBuilder.order.mockImplementation(() => {
          return Promise.resolve({
            data: [mockBulkOperation],
            error: null,
          });
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/bulk-operations`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({ status: 'PENDING', type: 'create_consent' })
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBe(1);
          expect(res.body[0].status).toBe('PENDING');
          expect(res.body[0].type).toBe('create_consent');
        });
    });
  });

  describe('/companies/:companyId/bulk-operations/:id (GET)', () => {
    it('should return a specific bulk operation', () => {
      // Mock para obtener una operación
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para single
        queryBuilder.single.mockImplementation(() => {
          return Promise.resolve({
            data: mockBulkOperation,
            error: null,
          });
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/bulk-operations/${mockBulkOpId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockBulkOpId);
          expect(res.body.company_id).toBe(mockCompanyId);
        });
    });

    it('should return 404 when bulk operation not found', () => {
      // Mock para operación no encontrada
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para single con error
        queryBuilder.single.mockImplementation(() => {
          return Promise.resolve({
            data: null,
            error: { message: 'No rows found' },
          });
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .get(`/companies/${mockCompanyId}/bulk-operations/non-existent-id`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(404);
    });
  });

  describe('/companies/:companyId/bulk-operations/:id (PATCH)', () => {
    it('should update a bulk operation', () => {
      // Mock para findOne y update
      mockFrom.mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para single
        queryBuilder.single.mockImplementation(() => {
          return Promise.resolve({
            data: mockBulkOperation,
            error: null,
          });
        });
        
        return queryBuilder;
      }).mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para update
        const updatedOperation = {
          ...mockBulkOperation,
          metadata: { source: 'updated-source' }
        };
        
        queryBuilder.update.mockImplementation(() => {
          return {
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: updatedOperation,
                  error: null,
                }),
              }),
            }),
          };
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .patch(`/companies/${mockCompanyId}/bulk-operations/${mockBulkOpId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(mockUpdateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockBulkOpId);
          expect(res.body.metadata.source).toBe('updated-source');
        });
    });
  });

  describe('/companies/:companyId/bulk-operations/:id/status (PATCH)', () => {
    it('should update a bulk operation status', () => {
      // Mock para findOne y update status
      mockFrom.mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para single
        queryBuilder.single.mockImplementation(() => {
          return Promise.resolve({
            data: mockBulkOperation,
            error: null,
          });
        });
        
        return queryBuilder;
      }).mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para update
        const statusUpdatedOperation = {
          ...mockBulkOperation,
          status: 'COMPLETED'
        };
        
        queryBuilder.update.mockImplementation(() => {
          return {
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: statusUpdatedOperation,
                  error: null,
                }),
              }),
            }),
          };
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .patch(`/companies/${mockCompanyId}/bulk-operations/${mockBulkOpId}/status`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(mockBulkOpId);
          expect(res.body.status).toBe('COMPLETED');
        });
    });
  });

  describe('/companies/:companyId/bulk-operations/:id (DELETE)', () => {
    it('should delete a bulk operation', () => {
      // Mock para findOne y delete
      mockFrom.mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para single
        queryBuilder.single.mockImplementation(() => {
          return Promise.resolve({
            data: mockBulkOperation,
            error: null,
          });
        });
        
        return queryBuilder;
      }).mockImplementationOnce(() => {
        const queryBuilder = createQueryBuilder();
        
        // Mock para delete
        queryBuilder.delete.mockImplementation(() => {
          return {
            eq: () => Promise.resolve({
              error: null,
            }),
          };
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .delete(`/companies/${mockCompanyId}/bulk-operations/${mockBulkOpId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .expect(204);
    });
  });

  afterAll(async () => {
    await app.close();
  });
}); 