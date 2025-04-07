import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Request } from 'express';
import {
  ConsentReportQueryDto,
  ConsentReportResultDto,
  AuditReportQueryDto,
  AuditReportResultDto,
  MetricsQueryDto,
  MetricsResultDto,
} from './dto';
import { ConsentStatus } from '../consents/dto';
import { ResourceType } from '../common/audit/audit.service';
import { AuditAction } from '../common/audit/audit.service';

// Mock del servicio de reportes
const mockReportsService = {
  generateAuditReport: jest.fn(),
  generateConsentReport: jest.fn(),
  generateMetrics: jest.fn(),
};

// Mock del guard de autenticación
const mockJwtAuthGuard = { canActivate: jest.fn() };

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  // Mock data
  const mockConsentReportQuery: ConsentReportQueryDto = {
    companyId: 'company-123',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: ConsentStatus.GRANTED,
    page: 1,
    pageSize: 10
  };

  const mockConsentReportResult: ConsentReportResultDto = {
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

  const mockAuditReportQuery: AuditReportQueryDto = {
    companyId: 'company-123',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    resourceType: ResourceType.CONSENT,
    action: AuditAction.CREATE,
    page: 1,
    pageSize: 10
  };

  const mockAuditReportResult: AuditReportResultDto = {
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
        userId: 'user-123',
        metadata: { details: 'Created new consent' },
        createdAt: '2023-01-15T10:00:00Z'
      }
    ]
  };

  const mockMetricsQuery: MetricsQueryDto = {
    companyId: 'company-123',
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  };

  const mockMetricsResult: MetricsResultDto = {
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
      .overrideGuard(JwtGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateConsentReport', () => {
    it('should generate a consent report', async () => {
      // Arrange
      mockReportsService.generateConsentReport.mockResolvedValue(mockConsentReportResult);

      // Act
      const result = await controller.generateConsentReport(mockConsentReportQuery);

      // Assert
      expect(service.generateConsentReport).toHaveBeenCalledWith(mockConsentReportQuery);
      expect(result).toEqual(mockConsentReportResult);
      expect(result.total).toBe(10);
      expect(result.items.length).toBe(1);
    });

    it('should handle errors when generating consent report', async () => {
      // Arrange
      const errorMessage = 'Error generating consent report';
      mockReportsService.generateConsentReport.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.generateConsentReport(mockConsentReportQuery)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('generateAuditReport', () => {
    it('should generate an audit report', async () => {
      // Arrange
      mockReportsService.generateAuditReport.mockResolvedValue(mockAuditReportResult);

      // Act
      const result = await controller.generateAuditReport(mockAuditReportQuery);

      // Assert
      expect(service.generateAuditReport).toHaveBeenCalledWith(mockAuditReportQuery);
      expect(result).toEqual(mockAuditReportResult);
      expect(result.total).toBe(5);
      expect(result.items[0].action).toBe(AuditAction.CREATE);
      expect(result.items[0].resourceType).toBe(ResourceType.CONSENT);
    });

    it('should handle errors when generating audit report', async () => {
      // Arrange
      const errorMessage = 'Error generating audit report';
      mockReportsService.generateAuditReport.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.generateAuditReport(mockAuditReportQuery)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('generateMetrics', () => {
    it('should generate metrics', async () => {
      // Arrange
      mockReportsService.generateMetrics.mockResolvedValue(mockMetricsResult);

      // Act
      const result = await controller.generateMetrics(mockMetricsQuery);

      // Assert
      expect(service.generateMetrics).toHaveBeenCalledWith(mockMetricsQuery);
      expect(result).toEqual(mockMetricsResult);
      expect(result.summary.acceptanceRate).toBe(85.5);
      expect(result.summary.totalConsents).toBe(100);
      expect(result.series[0].data.length).toBe(2);
    });

    it('should handle errors when generating metrics', async () => {
      // Arrange
      const errorMessage = 'Error generating metrics';
      mockReportsService.generateMetrics.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.generateMetrics(mockMetricsQuery)
      ).rejects.toThrow(errorMessage);
    });
  });
});
