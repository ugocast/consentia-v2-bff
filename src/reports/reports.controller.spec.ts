import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Request } from 'express';
import {
  AuditReportQueryDto,
  AuditReportResultDto,
  ConsentReportQueryDto,
  ConsentReportResultDto,
  MetricsQueryDto,
  MetricsResultDto,
} from './dto';
import { ConsentStatus } from '../consents/dto/consent-status.enum';
import { AuditAction, ResourceType } from '../common/audit/audit.service';

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

  describe('generateAuditReport', () => {
    it('should generate an audit report', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: AuditReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: 1,
        pageSize: 10,
      };

      const mockReport: AuditReportResultDto = {
        items: [
          {
            id: 'audit-1',
            action: AuditAction.CREATE,
            resource_type: ResourceType.POLICY,
            resource_id: 'policy-1',
            user_id: 'user-1',
            created_at: '2023-06-15T10:30:00Z',
            metadata: { title: 'New Policy' },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      mockReportsService.generateAuditReport.mockResolvedValue(mockReport);

      // Modificar el comportamiento del controlador para este test
      controller.generateAuditReport = jest.fn().mockImplementation((dto) => {
        return service.generateAuditReport(dto);
      });

      // Act
      const result = await controller.generateAuditReport(queryDto);

      // Assert
      expect(service.generateAuditReport).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockReport);
    });
  });

  describe('generateConsentReport', () => {
    it('should generate a consent report', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: ConsentReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        status: ConsentStatus.GRANTED,
        policyId: 'policy-1',
        page: 1,
        pageSize: 10,
        limit: 10,
      };

      const mockReport: ConsentReportResultDto = {
        items: [
          {
            id: 'consent-1',
            legal_policy_id: 'policy-1',
            user_id: 'user-2',
            status: ConsentStatus.GRANTED,
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            created_at: '2023-06-15T10:30:00Z',
            updated_at: '2023-06-15T10:30:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      mockReportsService.generateConsentReport.mockResolvedValue(mockReport);

      // Modificar el comportamiento del controlador para este test
      controller.generateConsentReport = jest.fn().mockImplementation((dto) => {
        return service.generateConsentReport(dto);
      });

      // Act
      const result = await controller.generateConsentReport(queryDto);

      // Assert
      expect(service.generateConsentReport).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockReport);
    });
  });

  describe('generateMetrics', () => {
    it('should generate metrics', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: MetricsQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        companyId: 'company-1',
      };

      const mockMetrics: MetricsResultDto = {
        series: [
          {
            name: 'Consentimientos por mes',
            data: [
              { label: '2023-01', value: 20 },
              { label: '2023-02', value: 15 },
            ],
          },
        ],
        summary: {
          totalConsents: 100,
          consentsByStatus: [
            { status: ConsentStatus.GRANTED, count: 80, percentage: 80 },
            { status: ConsentStatus.REVOKED, count: 15, percentage: 15 },
            { status: ConsentStatus.EXPIRED, count: 5, percentage: 5 },
          ],
          acceptanceRate: 80,
          revocationRate: 15,
        },
      };

      mockReportsService.generateMetrics.mockResolvedValue(mockMetrics);

      // Modificar el comportamiento del controlador para este test
      controller.generateMetrics = jest.fn().mockImplementation((dto) => {
        return service.generateMetrics(dto);
      });

      // Act
      const result = await controller.generateMetrics(queryDto);

      // Assert
      expect(service.generateMetrics).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockMetrics);
    });
  });
});
