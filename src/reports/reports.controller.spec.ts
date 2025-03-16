import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Request } from 'express';
import {
  AuditReportQueryDto,
  AuditReportResultDto,
  ConsentReportQueryDto,
  ConsentReportResultDto,
  MetricsQueryDto,
  MetricsResultDto
} from './dto';

// Mock del servicio de reportes
const mockReportsService = {
  getAuditReport: jest.fn(),
  getConsentReport: jest.fn(),
  getMetrics: jest.fn(),
};

// Mock del guard de autenticación
const mockJwtAuthGuard = { canActivate: jest.fn() };

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAuditReport', () => {
    it('should return audit report', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: AuditReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        resourceType: 'POLICY',
        action: 'CREATE',
        page: 1,
        limit: 10,
      };
      
      const mockReport: AuditReportResultDto = {
        data: [
          {
            id: 'audit-1',
            action: 'CREATE',
            resourceType: 'POLICY',
            resourceId: 'policy-1',
            userId: 'user-1',
            timestamp: '2023-06-15T10:30:00Z',
            details: { title: 'New Policy' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };
      
      mockReportsService.getAuditReport.mockResolvedValue(mockReport);
      
      // Mock de la solicitud con el usuario autenticado
      const mockRequest = {
        user: { id: userId },
      } as unknown as Request;

      // Act
      const result = await controller.getAuditReport(queryDto, mockRequest);

      // Assert
      expect(service.getAuditReport).toHaveBeenCalledWith(queryDto, userId);
      expect(result).toEqual(mockReport);
    });
  });

  describe('getConsentReport', () => {
    it('should return consent report', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: ConsentReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        status: 'ACTIVE',
        policyId: 'policy-1',
        page: 1,
        limit: 10,
      };
      
      const mockReport: ConsentReportResultDto = {
        data: [
          {
            id: 'consent-1',
            policyId: 'policy-1',
            policyTitle: 'Privacy Policy',
            dataSubjectId: 'user-2',
            dataSubjectEmail: 'user2@example.com',
            status: 'ACTIVE',
            createdAt: '2023-06-15T10:30:00Z',
            updatedAt: '2023-06-15T10:30:00Z',
            expiresAt: '2024-06-15T10:30:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };
      
      mockReportsService.getConsentReport.mockResolvedValue(mockReport);
      
      // Mock de la solicitud con el usuario autenticado
      const mockRequest = {
        user: { id: userId },
      } as unknown as Request;

      // Act
      const result = await controller.getConsentReport(queryDto, mockRequest);

      // Assert
      expect(service.getConsentReport).toHaveBeenCalledWith(queryDto, userId);
      expect(result).toEqual(mockReport);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: MetricsQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        companyId: 'company-1',
      };
      
      const mockMetrics: MetricsResultDto = {
        totalPolicies: 10,
        activePolicies: 8,
        totalConsents: 100,
        activeConsents: 80,
        revokedConsents: 15,
        expiredConsents: 5,
        consentsByPolicy: [
          { policyId: 'policy-1', policyTitle: 'Privacy Policy', count: 50 },
          { policyId: 'policy-2', policyTitle: 'Terms of Service', count: 50 },
        ],
        consentTrend: [
          { date: '2023-01', granted: 20, revoked: 5 },
          { date: '2023-02', granted: 15, revoked: 3 },
        ],
      };
      
      mockReportsService.getMetrics.mockResolvedValue(mockMetrics);
      
      // Mock de la solicitud con el usuario autenticado
      const mockRequest = {
        user: { id: userId },
      } as unknown as Request;

      // Act
      const result = await controller.getMetrics(queryDto, mockRequest);

      // Assert
      expect(service.getMetrics).toHaveBeenCalledWith(queryDto, userId);
      expect(result).toEqual(mockMetrics);
    });
  });
});
