import { Test, TestingModule } from '@nestjs/testing';
import { ExternalIntegrationsService } from './external-integrations.service';
import { AuditService } from '../common/audit/audit.service';
import { Logger, NotFoundException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { ExternalIntegrationStatus } from './dto/external-integration-status.enum';

jest.mock('../config/supabase.config');

describe('ExternalIntegrationsService', () => {
  let service: ExternalIntegrationsService;
  let auditService: AuditService;
  let mockSupabaseClient: any;

  const mockExternalIntegration = {
    id: 'test-id',
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

  const mockExternalIntegrationDto = {
    id: 'test-id',
    companyId: 'test-company-id',
    name: 'Test Integration',
    type: 'CRM',
    endpoint: 'https://example.com/api',
    apiKey: 'api-key-123',
    status: ExternalIntegrationStatus.ACTIVE,
    metadata: { webhookUrl: 'https://example.com/webhook' },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user-123',
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
    // Mock de Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalIntegrationsService,
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ExternalIntegrationsService>(ExternalIntegrationsService);
    auditService = module.get<AuditService>(AuditService);
    
    // Espiar al logger para evitar logs durante los tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an external integration successfully', async () => {
      const companyId = 'test-company-id';
      const userId = 'user-123';
      
      mockSupabaseClient.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockExternalIntegration,
            error: null,
          }),
        }),
      });

      const result = await service.create(companyId, mockCreateDto, userId);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('external_integration');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: mockCreateDto.name,
        type: mockCreateDto.type,
        company_id: companyId,
        created_by: userId,
      }));
      
      expect(auditService.log).toHaveBeenCalled();
      expect(result).toEqual(mockExternalIntegrationDto);
    });

    it('should throw an error when Supabase returns an error', async () => {
      const companyId = 'test-company-id';
      const userId = 'user-123';
      
      mockSupabaseClient.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(service.create(companyId, mockCreateDto, userId))
        .rejects.toEqual({ message: 'Database error' });
      
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all external integrations for a company', async () => {
      const companyId = 'test-company-id';
      
      mockSupabaseClient.select.mockResolvedValue({
        data: [mockExternalIntegration],
        error: null,
      });

      const result = await service.findAll(companyId);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('external_integration');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', companyId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      
      expect(result).toEqual([mockExternalIntegrationDto]);
    });

    it('should throw an error when Supabase returns an error', async () => {
      const companyId = 'test-company-id';
      
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findAll(companyId))
        .rejects.toEqual({ message: 'Database error' });
    });
  });

  describe('findOne', () => {
    it('should return an external integration by ID', async () => {
      const companyId = 'test-company-id';
      const id = 'test-id';
      
      mockSupabaseClient.single.mockResolvedValue({
        data: mockExternalIntegration,
        error: null,
      });

      const result = await service.findOne(companyId, id);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('external_integration');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', companyId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', id);
      expect(mockSupabaseClient.single).toHaveBeenCalled();
      
      expect(result).toEqual(mockExternalIntegrationDto);
    });

    it('should throw NotFoundException when integration not found', async () => {
      const companyId = 'test-company-id';
      const id = 'non-existent-id';
      
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      await expect(service.findOne(companyId, id))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an external integration successfully', async () => {
      const companyId = 'test-company-id';
      const id = 'test-id';
      const userId = 'user-123';
      
      // Mock para findOne
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExternalIntegration,
        error: null,
      });
      
      // Mock para update
      mockSupabaseClient.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockExternalIntegration, name: 'Updated Integration', endpoint: 'https://example.com/api/v2' },
            error: null,
          }),
        }),
      });

      const result = await service.update(companyId, id, mockUpdateDto, userId);
      
      expect(result.name).toEqual('Updated Integration');
      expect(result.endpoint).toEqual('https://example.com/api/v2');
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw an error when Supabase update returns an error', async () => {
      const companyId = 'test-company-id';
      const id = 'test-id';
      const userId = 'user-123';
      
      // Mock para findOne
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExternalIntegration,
        error: null,
      });
      
      // Mock para update
      mockSupabaseClient.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update error' },
          }),
        }),
      });

      await expect(service.update(companyId, id, mockUpdateDto, userId))
        .rejects.toEqual({ message: 'Update error' });
      
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should mark an external integration as deleted', async () => {
      const companyId = 'test-company-id';
      const id = 'test-id';
      const userId = 'user-123';
      
      // Mock para findOne
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExternalIntegration,
        error: null,
      });
      
      // Mock para update (el soft delete es un update)
      mockSupabaseClient.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      await service.remove(companyId, id, userId);
      
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        status: ExternalIntegrationStatus.DELETED,
      }));
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw an error when Supabase remove returns an error', async () => {
      const companyId = 'test-company-id';
      const id = 'test-id';
      const userId = 'user-123';
      
      // Mock para findOne
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExternalIntegration,
        error: null,
      });
      
      // Mock para update (el soft delete es un update)
      mockSupabaseClient.update.mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          error: { message: 'Delete error' },
        }),
      });

      await expect(service.remove(companyId, id, userId))
        .rejects.toEqual({ message: 'Delete error' });
      
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('transformToCamelCase', () => {
    it('should transform snake_case object to camelCase', () => {
      const result = service['transformToCamelCase'](mockExternalIntegration);
      expect(result).toEqual(mockExternalIntegrationDto);
    });

    it('should handle null values without errors', () => {
      const incompleteData = {
        ...mockExternalIntegration,
        metadata: null,
        updated_at: null
      };
      
      const result = service['transformToCamelCase'](incompleteData);
      
      expect(result).toEqual({
        ...mockExternalIntegrationDto,
        metadata: null,
        updatedAt: null
      });
    });
  });

  describe('validation scenarios', () => {
    it('should not allow creating integration with invalid company ID', async () => {
      const invalidCompanyId = '';
      const userId = 'user-123';
      
      await expect(service.create(invalidCompanyId, mockCreateDto, userId))
        .rejects.toThrow();
    });
    
    it('should validate required fields when creating integration', async () => {
      const companyId = 'test-company-id';
      const userId = 'user-123';
      const invalidCreateDto = { 
        name: '', // Empty name
        type: 'CRM',
        endpoint: 'https://example.com/api',
        apiKey: 'api-key-123',
      };
      
      mockSupabaseClient.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Validation error', details: 'Name is required' },
          }),
        }),
      });
      
      await expect(service.create(companyId, invalidCreateDto as any, userId))
        .rejects.toEqual(expect.objectContaining({ 
          message: 'Validation error' 
        }));
    });
  });

  describe('edge cases', () => {
    describe('findAll edge cases', () => {
      it('should return empty array when no integrations exist', async () => {
        const companyId = 'test-company-id';
        
        mockSupabaseClient.select.mockResolvedValue({
          data: [],
          error: null,
        });
  
        const result = await service.findAll(companyId);
        
        expect(result).toEqual([]);
      });
    });

    describe('findOne edge cases', () => {
      it('should throw NotFoundException with appropriate message', async () => {
        const companyId = 'test-company-id';
        const id = 'non-existent-id';
        
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: { message: 'No rows found' },
        });
  
        try {
          await service.findOne(companyId, id);
          fail('Expected NotFoundException to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toContain(id);
        }
      });
    });

    describe('remove edge cases', () => {
      it('should handle case when integration is already deleted', async () => {
        const companyId = 'test-company-id';
        const id = 'test-id';
        const userId = 'user-123';
        
        // Mock findOne to return already deleted integration
        mockSupabaseClient.single.mockResolvedValue({
          data: { 
            ...mockExternalIntegration,
            status: ExternalIntegrationStatus.DELETED 
          },
          error: null,
        });
        
        // Mock update
        mockSupabaseClient.update.mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({
            error: null,
          }),
        });
        
        await service.remove(companyId, id, userId);
        
        // Should still update the record (e.g., to update the updated_at field)
        expect(mockSupabaseClient.update).toHaveBeenCalled();
        expect(auditService.log).toHaveBeenCalled();
      });
    });
  });
});
