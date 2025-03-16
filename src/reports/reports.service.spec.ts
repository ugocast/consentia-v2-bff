import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import {
  mockSupabaseClient,
  mockCreateSupabaseClient,
} from '../common/mocks/supabase.mock';
import {
  AuditReportQueryDto,
  ConsentReportQueryDto,
  MetricsQueryDto,
} from './dto';
import { AuditAction, ResourceType } from '../common/audit/audit.types';
import { ConsentStatus } from '../consents/dto/consent-status.enum';

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    // Configurar el mock para devolver el cliente de Supabase
    mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAuditReport', () => {
    it('should generate audit report', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: AuditReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        resourceType: ResourceType.POLICY,
        action: AuditAction.CREATE,
        page: 1,
        limit: 10,
      };

      const mockAuditLogs = [
        {
          id: 'audit-1',
          action: AuditAction.CREATE,
          resource_type: ResourceType.POLICY,
          resource_id: 'policy-1',
          user_id: 'user-1',
          created_at: '2023-06-15T10:30:00Z',
          details: { title: 'New Policy' },
        },
      ];

      // Mock para la consulta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.gte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.lte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.count.mockReturnValue(mockSupabaseClient);

      // Configurar el mock para devolver los datos
      const mockResponse = {
        data: mockAuditLogs,
        error: null,
        count: 1,
      };

      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockResponse);
      mockSupabaseClient.then = mockThen;

      // Act
      const result = await service.generateAuditReport(queryDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_log');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith(
        'created_at',
        expect.any(String),
      );
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith(
        'created_at',
        expect.any(String),
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'resource_type',
        queryDto.resourceType,
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'action',
        queryDto.action,
      );
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(
        (queryDto.page - 1) * queryDto.limit,
        queryDto.page * queryDto.limit - 1,
      );

      expect(result.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'audit-1',
            action: AuditAction.CREATE,
            resourceType: ResourceType.POLICY,
            resourceId: 'policy-1',
            userId: 'user-1',
            timestamp: '2023-06-15T10:30:00Z',
            details: { title: 'New Policy' },
          }),
        ]),
      );
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: AuditReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: 1,
        limit: 10,
      };

      // Mock para la consulta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.gte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.lte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.count.mockReturnValue(mockSupabaseClient);

      // Configurar el mock para devolver un error
      const mockResponse = {
        data: null,
        error: { message: 'Database error' },
        count: 0,
      };

      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockResponse);
      mockSupabaseClient.then = mockThen;

      // Act & Assert
      await expect(
        service.generateAuditReport(queryDto, userId),
      ).rejects.toThrow(
        'Error al generar reporte de auditoría: Database error',
      );
    });
  });

  describe('generateConsentReport', () => {
    it('should generate consent report', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: ConsentReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        status: ConsentStatus.GRANTED,
        policyId: 'policy-1',
        page: 1,
        limit: 10,
      };

      const mockConsents = [
        {
          id: 'consent-1',
          legal_policy_id: 'policy-1',
          data_subject_id: 'user-2',
          status: ConsentStatus.GRANTED,
          created_at: '2023-06-15T10:30:00Z',
          updated_at: '2023-06-15T10:30:00Z',
          expires_at: '2024-06-15T10:30:00Z',
          policy: {
            title: 'Privacy Policy',
          },
          data_subject: {
            email: 'user2@example.com',
          },
        },
      ];

      // Mock para la consulta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.gte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.lte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.count.mockReturnValue(mockSupabaseClient);

      // Configurar el mock para devolver los datos
      const mockResponse = {
        data: mockConsents,
        error: null,
        count: 1,
      };

      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockResponse);
      mockSupabaseClient.then = mockThen;

      // Act
      const result = await service.generateConsentReport(queryDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        '*, policy:legal_policy_id(title), data_subject:data_subject_id(email)',
      );
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith(
        'created_at',
        expect.any(String),
      );
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith(
        'created_at',
        expect.any(String),
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'status',
        queryDto.status,
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'legal_policy_id',
        queryDto.policyId,
      );
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(
        (queryDto.page - 1) * queryDto.limit,
        queryDto.page * queryDto.limit - 1,
      );

      expect(result.consents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'consent-1',
            policyId: 'policy-1',
            policyTitle: 'Privacy Policy',
            dataSubjectId: 'user-2',
            dataSubjectEmail: 'user2@example.com',
            status: ConsentStatus.GRANTED,
            createdAt: '2023-06-15T10:30:00Z',
            updatedAt: '2023-06-15T10:30:00Z',
            expiresAt: '2024-06-15T10:30:00Z',
          }),
        ]),
      );
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: ConsentReportQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: 1,
        limit: 10,
      };

      // Mock para la consulta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.gte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.lte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.range.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.count.mockReturnValue(mockSupabaseClient);

      // Configurar el mock para devolver un error
      const mockResponse = {
        data: null,
        error: { message: 'Database error' },
        count: 0,
      };

      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockResponse);
      mockSupabaseClient.then = mockThen;

      // Act & Assert
      await expect(
        service.generateConsentReport(queryDto, userId),
      ).rejects.toThrow(
        'Error al generar reporte de consentimientos: Database error',
      );
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

      // Mock para las consultas de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.count.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.gte.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.lte.mockReturnValue(mockSupabaseClient);

      // Configurar los mocks para devolver los datos
      // Total de políticas
      const mockTotalPoliciesResponse = {
        data: null,
        error: null,
        count: 10,
      };

      // Políticas activas
      const mockActivePoliciesResponse = {
        data: null,
        error: null,
        count: 8,
      };

      // Total de consentimientos
      const mockTotalConsentsResponse = {
        data: null,
        error: null,
        count: 100,
      };

      // Consentimientos activos
      const mockActiveConsentsResponse = {
        data: null,
        error: null,
        count: 80,
      };

      // Consentimientos revocados
      const mockRevokedConsentsResponse = {
        data: null,
        error: null,
        count: 15,
      };

      // Consentimientos expirados
      const mockExpiredConsentsResponse = {
        data: null,
        error: null,
        count: 5,
      };

      // Consentimientos por política
      const mockConsentsByPolicyResponse = {
        data: [
          { legal_policy_id: 'policy-1', title: 'Privacy Policy', count: 50 },
          { legal_policy_id: 'policy-2', title: 'Terms of Service', count: 50 },
        ],
        error: null,
      };

      // Tendencia de consentimientos
      const mockConsentTrendResponse = {
        data: [
          { month: '2023-01', granted: 20, revoked: 5 },
          { month: '2023-02', granted: 15, revoked: 3 },
        ],
        error: null,
      };

      // Configurar las respuestas en secuencia
      mockSupabaseClient.then = jest
        .fn()
        .mockResolvedValueOnce(mockTotalPoliciesResponse)
        .mockResolvedValueOnce(mockActivePoliciesResponse)
        .mockResolvedValueOnce(mockTotalConsentsResponse)
        .mockResolvedValueOnce(mockActiveConsentsResponse)
        .mockResolvedValueOnce(mockRevokedConsentsResponse)
        .mockResolvedValueOnce(mockExpiredConsentsResponse)
        .mockResolvedValueOnce(mockConsentsByPolicyResponse)
        .mockResolvedValueOnce(mockConsentTrendResponse);

      // Act
      const result = await service.generateMetrics(queryDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent');

      expect(result.totalPolicies).toBe(10);
      expect(result.activePolicies).toBe(8);
      expect(result.totalConsents).toBe(100);
      expect(result.activeConsents).toBe(80);
      expect(result.revokedConsents).toBe(15);
      expect(result.expiredConsents).toBe(5);

      expect(result.consentsByPolicy).toEqual([
        { policyId: 'policy-1', policyTitle: 'Privacy Policy', count: 50 },
        { policyId: 'policy-2', policyTitle: 'Terms of Service', count: 50 },
      ]);

      expect(result.consentTrend).toEqual([
        { date: '2023-01', granted: 20, revoked: 5 },
        { date: '2023-02', granted: 15, revoked: 3 },
      ]);
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      const userId = 'user-1';
      const queryDto: MetricsQueryDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        companyId: 'company-1',
      };

      // Mock para las consultas de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.count.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);

      // Configurar el mock para devolver un error
      const mockErrorResponse = {
        data: null,
        error: { message: 'Database error' },
        count: 0,
      };

      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockErrorResponse);
      mockSupabaseClient.then = mockThen;

      // Act & Assert
      await expect(service.generateMetrics(queryDto, userId)).rejects.toThrow(
        'Error al generar métricas: Database error',
      );
    });
  });
});
