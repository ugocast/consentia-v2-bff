import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditAction, ResourceType, AuditLogEntry } from './audit.service';

// Mock para Supabase
const mockSupabaseInsert = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseGte = jest.fn();
const mockSupabaseLte = jest.fn();
const mockSupabaseOrder = jest.fn();
const mockSupabaseRange = jest.fn();
const mockSupabaseFrom = jest.fn();

// Mock del módulo de configuración de Supabase
jest.mock('../../config/supabase.config', () => ({
  createSupabaseClient: jest.fn().mockImplementation(() => ({
    from: mockSupabaseFrom.mockImplementation(() => ({
      insert: mockSupabaseInsert,
      select: mockSupabaseSelect.mockImplementation(() => ({
        eq: mockSupabaseEq.mockImplementation(() => ({
          eq: mockSupabaseEq,
          gte: mockSupabaseGte,
          lte: mockSupabaseLte,
          order: mockSupabaseOrder,
        })),
        gte: mockSupabaseGte.mockImplementation(() => ({
          lte: mockSupabaseLte,
          order: mockSupabaseOrder,
        })),
        lte: mockSupabaseLte.mockImplementation(() => ({
          order: mockSupabaseOrder,
        })),
        order: mockSupabaseOrder.mockImplementation(() => ({
          range: mockSupabaseRange,
        })),
      })),
    })),
  })),
}));

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log an audit action successfully', async () => {
      // Arrange
      const auditEntry: AuditLogEntry = {
        action: AuditAction.CREATE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: 'policy-1',
        userId: 'user-1',
        metadata: { title: 'New Policy' },
      };

      // Configurar el mock para devolver una respuesta exitosa
      mockSupabaseInsert.mockResolvedValue({ data: { id: 'audit-1' }, error: null });

      // Act
      await service.log(auditEntry);

      // Assert
      expect(mockSupabaseFrom).toHaveBeenCalledWith('audit_log');
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        action: auditEntry.action,
        resource_type: auditEntry.resourceType,
        resource_id: auditEntry.resourceId,
        user_id: auditEntry.userId,
        previous_resource_id: undefined,
        metadata: auditEntry.metadata,
        ip_address: undefined,
        user_agent: undefined,
      });
    });

    it('should handle missing optional fields', async () => {
      // Arrange
      const auditEntry: AuditLogEntry = {
        action: AuditAction.UPDATE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: 'policy-1',
        userId: 'user-1',
        // No metadata provided
      };

      // Configurar el mock para devolver una respuesta exitosa
      mockSupabaseInsert.mockResolvedValue({ data: { id: 'audit-1' }, error: null });

      // Act
      await service.log(auditEntry);

      // Assert
      expect(mockSupabaseFrom).toHaveBeenCalledWith('audit_log');
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        action: auditEntry.action,
        resource_type: auditEntry.resourceType,
        resource_id: auditEntry.resourceId,
        user_id: auditEntry.userId,
        previous_resource_id: undefined,
        metadata: undefined,
        ip_address: undefined,
        user_agent: undefined,
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const auditEntry: AuditLogEntry = {
        action: AuditAction.DELETE_POLICY,
        resourceType: ResourceType.POLICY,
        resourceId: 'policy-1',
        userId: 'user-1',
      };

      // Configurar el mock para devolver un error
      mockSupabaseInsert.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      // Espiar el método logger.error
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // Act
      await service.log(auditEntry);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'Error al registrar en el log de auditoría: Database error',
        expect.anything()
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      // Arrange
      const filters = {
        userId: 'user-1',
        resourceType: ResourceType.POLICY,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };
      const page = 1;
      const pageSize = 10;

      const mockLogs = [
        {
          id: 'audit-1',
          action: AuditAction.CREATE_POLICY,
          resource_type: ResourceType.POLICY,
          resource_id: 'policy-1',
          user_id: 'user-1',
          created_at: '2023-06-15T10:30:00Z',
          metadata: { title: 'New Policy' },
        },
        {
          id: 'audit-2',
          action: AuditAction.UPDATE_POLICY,
          resource_type: ResourceType.POLICY,
          resource_id: 'policy-2',
          user_id: 'user-1',
          created_at: '2023-06-16T10:30:00Z',
          metadata: { title: 'Another Policy' },
        },
      ];

      // Configurar el mock para devolver los logs
      mockSupabaseRange.mockResolvedValue({ data: mockLogs, error: null, count: 2 });

      // Act
      const result = await service.getAuditLogs(filters, page, pageSize);

      // Assert
      expect(mockSupabaseFrom).toHaveBeenCalledWith('audit_log');
      expect(mockSupabaseSelect).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabaseEq).toHaveBeenCalledWith('user_id', filters.userId);
      expect(mockSupabaseEq).toHaveBeenCalledWith('resource_type', filters.resourceType);
      expect(mockSupabaseGte).toHaveBeenCalledWith('created_at', filters.startDate);
      expect(mockSupabaseLte).toHaveBeenCalledWith('created_at', filters.endDate);
      expect(mockSupabaseOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseRange).toHaveBeenCalledWith(
        (page - 1) * pageSize,
        (page - 1) * pageSize + pageSize - 1
      );
      
      expect(result.items).toEqual(mockLogs);
      expect(result.total).toBe(2);
    });

    it('should throw an error when retrieving logs fails', async () => {
      // Arrange
      const filters = {
        userId: 'user-1',
      };
      const page = 1;
      const pageSize = 10;

      // Configurar el mock para devolver un error
      mockSupabaseRange.mockResolvedValue({ data: null, error: { message: 'Database error' }, count: 0 });

      // Act & Assert
      await expect(service.getAuditLogs(filters, page, pageSize))
        .rejects.toThrow('Error al obtener logs de auditoría: Database error');
    });
  });
});
