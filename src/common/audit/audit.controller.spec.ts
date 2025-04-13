import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService, AuditAction, ResourceType } from './audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Mock para JwtAuthGuard
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  beforeEach(async () => {
    // Mock del servicio de auditoría
    const mockAuditService = {
      getAuditLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAuditLogs', () => {
    it('should return audit logs with default pagination', async () => {
      // Arrange
      const mockLogs = {
        items: [
          {
            id: 'audit-1',
            action: AuditAction.CREATE_POLICY,
            resource_type: ResourceType.POLICY,
            resource_id: 'policy-1',
            user_id: 'user-1',
            created_at: '2023-06-15T10:30:00Z',
          },
        ],
        total: 1,
      };

      jest.spyOn(service, 'getAuditLogs').mockResolvedValue(mockLogs);

      // Act
      const result = await controller.getAuditLogs();

      // Assert
      expect(service.getAuditLogs).toHaveBeenCalledWith(
        {
          userId: undefined,
          resourceType: undefined,
          resourceId: undefined,
          action: undefined,
          startDate: undefined,
          endDate: undefined,
        },
        1,
        10,
      );
      expect(result).toEqual(mockLogs);
    });

    it('should return audit logs with provided filters and pagination', async () => {
      // Arrange
      const mockLogs = {
        items: [
          {
            id: 'audit-1',
            action: AuditAction.CREATE_POLICY,
            resource_type: ResourceType.POLICY,
            resource_id: 'policy-1',
            user_id: 'user-1',
            created_at: '2023-06-15T10:30:00Z',
          },
        ],
        total: 1,
      };

      jest.spyOn(service, 'getAuditLogs').mockResolvedValue(mockLogs);

      const userId = 'user-1';
      const resourceType = ResourceType.POLICY;
      const resourceId = 'policy-1';
      const action = AuditAction.CREATE_POLICY;
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const page = '2';
      const pageSize = '20';

      // Act
      const result = await controller.getAuditLogs(
        userId,
        resourceType,
        resourceId,
        action,
        startDate,
        endDate,
        page,
        pageSize,
      );

      // Assert
      expect(service.getAuditLogs).toHaveBeenCalledWith(
        {
          userId,
          resourceType,
          resourceId,
          action,
          startDate,
          endDate,
        },
        2,
        20,
      );
      expect(result).toEqual(mockLogs);
    });

    it('should handle invalid pagination parameters', async () => {
      // Arrange
      const mockLogs = {
        items: [],
        total: 0,
      };

      jest.spyOn(service, 'getAuditLogs').mockResolvedValue(mockLogs);

      // Act
      const result = await controller.getAuditLogs(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'invalid',
        'invalid',
      );

      // Assert
      expect(service.getAuditLogs).toHaveBeenCalledWith(
        {
          userId: undefined,
          resourceType: undefined,
          resourceId: undefined,
          action: undefined,
          startDate: undefined,
          endDate: undefined,
        },
        NaN,
        NaN,
      );
      expect(result).toEqual(mockLogs);
    });
  });
});
