import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { ConsentStatus } from '../src/consents/dto';
import { AuditAction, ResourceType } from '../src/common/audit/audit.service';

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
    rpc: jest.fn(),
    auth: mockAuthClient
  })),
}));

// Mock Supabase client
const mockFrom = jest.fn();
const mockRpc = jest.fn();

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  // Mock token para simular autenticación
  const mockAuthToken = 'test-auth-token';

  // Mock data
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  
  // Mock consent report result
  const mockConsentReportResult = {
    total: 10,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    items: [
      {
        id: 'consent-1',
        legalPolicyId: 'policy-1',
        userId: 'subject-1',
        status: ConsentStatus.GRANTED,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2023-01-15T10:00:00Z'
      }
    ]
  };

  // Mock audit report result
  const mockAuditReportResult = {
    total: 5,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    items: [
      {
        id: 'audit-1',
        action: AuditAction.CREATE,
        resourceType: ResourceType.CONSENT,
        resourceId: 'consent-1',
        userId: mockUserId,
        metadata: { details: 'Created new consent' },
        createdAt: '2023-01-15T10:00:00Z'
      }
    ]
  };

  // Mock metrics result
  const mockMetricsResult = {
    series: [
      {
        name: 'Consentimientos por mes',
        data: [
          { label: '2023-01', value: 80 },
          { label: '2023-02', value: 90 }
        ]
      }
    ],
    summary: {
      totalConsents: 100,
      consentsByStatus: [
        { status: ConsentStatus.GRANTED, count: 85, percentage: 85 },
        { status: ConsentStatus.REVOKED, count: 15, percentage: 15 }
      ],
      acceptanceRate: 85.5,
      revocationRate: 14.5
    }
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Actualizamos los mocks para evitar errores
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

    mockRpc.mockImplementation(() => {
      return Promise.resolve({
        data: [],
        error: null
      });
    });
    
    // Actualiza la referencia al mock de Supabase
    const supabase = require('../src/config/supabase.config');
    supabase.createSupabaseClient.mockReturnValue({
      from: mockFrom,
      rpc: mockRpc,
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
    await app.init();
  });

  describe('/reports/consents (GET)', () => {
    it('should generate a consent report', () => {
      // Mock para generar reporte de consentimientos
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Simulamos el comportamiento de range()
        queryBuilder.range.mockImplementation(() => {
          // Asignamos datos y conteo directamente
          queryBuilder.data = mockConsentReportResult.items.map(item => ({
            id: item.id,
            legal_policy_id: item.legalPolicyId,
            user_id: item.userId,
            status: item.status,
            ip_address: item.ipAddress,
            user_agent: item.userAgent,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            legal_policy: { company_id: mockCompanyId }
          }));
          
          // Al ejecutar la consulta, retornamos los datos y el conteo
          return Promise.resolve({
            data: queryBuilder.data,
            error: null,
            count: mockConsentReportResult.total
          });
        });
        
        return queryBuilder;
      });

      return request(app.getHttpServer())
        .get('/reports/consents')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({ 
          companyId: mockCompanyId,
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          status: ConsentStatus.GRANTED,
          page: 1,
          pageSize: 10
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(mockConsentReportResult.total);
          expect(res.body.items.length).toBe(1);
          expect(res.body.items[0].status).toBe(ConsentStatus.GRANTED);
        });
    });
  });

  describe('/reports/audit (GET)', () => {
    it('should generate an audit report', () => {
      // Mock para generar reporte de auditoría
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Simulamos el comportamiento de range()
        queryBuilder.range.mockImplementation(() => {
          // Asignamos datos y conteo directamente
          queryBuilder.data = mockAuditReportResult.items.map(item => ({
            id: item.id,
            action: item.action,
            resource_type: item.resourceType,
            resource_id: item.resourceId,
            user_id: item.userId,
            details: item.metadata.details,
            ip_address: 'test-ip',
            user_agent: 'test-agent',
            created_at: item.createdAt
          }));
          
          // Al ejecutar la consulta, retornamos los datos y el conteo
          return Promise.resolve({
            data: queryBuilder.data,
            error: null,
            count: mockAuditReportResult.total
          });
        });
        
        return queryBuilder;
      });
      
      return request(app.getHttpServer())
        .get('/reports/audit')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({ 
          companyId: mockCompanyId,
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          resourceType: ResourceType.CONSENT,
          action: AuditAction.CREATE,
          page: 1,
          pageSize: 10
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(mockAuditReportResult.total);
          expect(res.body.items.length).toBe(1);
          expect(res.body.items[0].resourceType).toBe(ResourceType.CONSENT);
          expect(res.body.items[0].action).toBe(AuditAction.CREATE);
        });
    });
  });

  describe('/reports/metrics (GET)', () => {
    it('should generate metrics', () => {
      // Mock para generar métricas
      mockFrom.mockImplementation(() => {
        const queryBuilder = createQueryBuilder();
        
        // Esta es la solución para el problema con el mock de métricas
        // Hacemos que select retorne un objeto con todas las propiedades necesarias
        // y reescribimos el método para que devuelva una promesa con los datos
        queryBuilder.select = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                data: [
                  {
                    id: 'consent-1',
                    legal_policy_id: 'policy-1',
                    user_id: 'subject-1',
                    status: ConsentStatus.GRANTED,
                    created_at: '2023-01-15T10:00:00Z',
                    updated_at: '2023-01-15T10:00:00Z',
                    legal_policy: {
                      id: 'policy-1',
                      title: 'Política de prueba',
                      company_id: mockCompanyId
                    }
                  }
                ],
                error: null
              })
            })
          })
        });
        
        return queryBuilder;
      });

      // Mock para consentimientos por mes (rpc)
      mockRpc.mockImplementation(() => {
        return Promise.resolve({
          data: [
            { month: '2023-01', count: 80 },
            { month: '2023-02', count: 90 }
          ],
          error: null
        });
      });

      return request(app.getHttpServer())
        .get('/reports/metrics')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({ 
          companyId: mockCompanyId,
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        })
        .expect(200)
        .expect((res) => {
          // Verificamos que la respuesta tenga la estructura esperada
          expect(res.body).toHaveProperty('summary');
          expect(res.body).toHaveProperty('series');
          expect(res.body.summary).toHaveProperty('totalConsents');
          expect(res.body.summary).toHaveProperty('acceptanceRate');
          expect(Array.isArray(res.body.series)).toBe(true);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
}); 