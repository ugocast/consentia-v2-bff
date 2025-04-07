import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { 
  mockSupabaseClient, 
  mockCreateSupabaseClient 
} from '../mocks/supabase.mock';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { 
  ApiKeyDto, 
  CreateApiKeyDto, 
  ApiKeyStatus 
} from './dto';
import { AuditService } from '../audit/audit.service';

// Mock de configuración de Supabase
jest.mock('../../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

// Mock del servicio de auditoría
const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Configurar el mock para retornar el cliente de Supabase
    mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should create a new API key', async () => {
      // Arrange
      const createDto: CreateApiKeyDto = {
        name: 'Test API Key',
        companyId: 'company-1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      };
      const userId = 'user-1';

      // Mock para insertar la clave API
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'api-key-1',
          name: createDto.name,
          key: 'generated-api-key-value',
          company_id: createDto.companyId,
          created_by: userId,
          status: ApiKeyStatus.ACTIVE,
          created_at: new Date().toISOString(),
          expires_at: createDto.expiresAt,
        },
        error: null,
      });

      // Act
      const result = await service.createApiKey(createDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_key');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: createDto.name,
        company_id: createDto.companyId,
        created_by: userId,
        expires_at: createDto.expiresAt,
      }));
      expect(result).toEqual(expect.objectContaining({
        id: 'api-key-1',
        name: createDto.name,
        key: 'generated-api-key-value',
        companyId: createDto.companyId,
        status: ApiKeyStatus.ACTIVE,
      }));
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException when validation fails', async () => {
      // Arrange
      const createDto: CreateApiKeyDto = {
        name: '', // Nombre inválido
        companyId: 'company-1',
      };
      const userId = 'user-1';

      // Act & Assert
      await expect(service.createApiKey(createDto, userId))
        .rejects.toThrow(BadRequestException);
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should throw an exception when database operation fails', async () => {
      // Arrange
      const createDto: CreateApiKeyDto = {
        name: 'Test API Key',
        companyId: 'company-1',
      };
      const userId = 'user-1';

      // Mock para simular un error en la base de datos
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(service.createApiKey(createDto, userId))
        .rejects.toThrow('Error al crear clave API: Database error');
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('getApiKeys', () => {
    it('should return all API keys for a company', async () => {
      // Arrange
      const companyId = 'company-1';
      const mockApiKeys = [
        {
          id: 'api-key-1',
          name: 'Test API Key 1',
          key: 'key-1',
          company_id: companyId,
          created_by: 'user-1',
          status: ApiKeyStatus.ACTIVE,
          created_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'api-key-2',
          name: 'Test API Key 2',
          key: 'key-2',
          company_id: companyId,
          created_by: 'user-1',
          status: ApiKeyStatus.ACTIVE,
          created_at: '2023-01-02T00:00:00Z',
          expires_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Mock para obtener las claves API
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValue({
        data: mockApiKeys,
        error: null,
      });

      // Act
      const result = await service.getApiKeys(companyId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_key');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', companyId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'api-key-1',
        name: 'Test API Key 1',
        companyId: companyId,
        status: ApiKeyStatus.ACTIVE,
      }));
      // Verificar que las claves API no contienen el valor real de la clave
      expect(result[0].key).toBeUndefined();
    });

    it('should return an empty array when no keys are found', async () => {
      // Arrange
      const companyId = 'company-no-keys';

      // Mock para simular que no se encuentran claves
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await service.getApiKeys(companyId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw an exception when database operation fails', async () => {
      // Arrange
      const companyId = 'company-1';

      // Mock para simular un error en la base de datos
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(service.getApiKeys(companyId))
        .rejects.toThrow('Error al obtener claves API: Database error');
    });
  });

  describe('getApiKeyById', () => {
    it('should return an API key by ID', async () => {
      // Arrange
      const keyId = 'api-key-1';
      const companyId = 'company-1';
      const mockApiKey = {
        id: keyId,
        name: 'Test API Key',
        key: 'key-value',
        company_id: companyId,
        created_by: 'user-1',
        status: ApiKeyStatus.ACTIVE,
        created_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      // Mock para obtener la clave API
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockApiKey,
        error: null,
      });

      // Act
      const result = await service.getApiKeyById(keyId, companyId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_key');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', keyId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', companyId);
      
      expect(result).toEqual(expect.objectContaining({
        id: keyId,
        name: 'Test API Key',
        companyId: companyId,
        status: ApiKeyStatus.ACTIVE,
      }));
      // Verificar que la clave no contiene el valor real
      expect(result.key).toBeUndefined();
    });

    it('should throw NotFoundException when API key is not found', async () => {
      // Arrange
      const keyId = 'non-existent-key';
      const companyId = 'company-1';

      // Mock para simular que no se encuentra la clave
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      // Act & Assert
      await expect(service.getApiKeyById(keyId, companyId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('validateApiKey', () => {
    it('should return true for a valid API key', async () => {
      // Arrange
      const apiKey = 'valid-api-key';
      const mockApiKey = {
        id: 'api-key-1',
        name: 'Test API Key',
        key: apiKey,
        company_id: 'company-1',
        created_by: 'user-1',
        status: ApiKeyStatus.ACTIVE,
        created_at: '2023-01-01T00:00:00Z',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Still valid
      };

      // Mock para buscar la clave API
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockApiKey,
        error: null,
      });

      // Act
      const result = await service.validateApiKey(apiKey);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_key');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('key', apiKey);
      
      expect(result).toEqual(expect.objectContaining({
        id: 'api-key-1',
        companyId: 'company-1',
        status: ApiKeyStatus.ACTIVE,
      }));
    });

    it('should throw UnauthorizedException for an invalid API key', async () => {
      // Arrange
      const apiKey = 'invalid-api-key';

      // Mock para simular que no se encuentra la clave
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      // Act & Assert
      await expect(service.validateApiKey(apiKey))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for an expired API key', async () => {
      // Arrange
      const apiKey = 'expired-api-key';
      const mockApiKey = {
        id: 'api-key-1',
        name: 'Test API Key',
        key: apiKey,
        company_id: 'company-1',
        created_by: 'user-1',
        status: ApiKeyStatus.ACTIVE,
        created_at: '2022-01-01T00:00:00Z',
        expires_at: '2022-01-31T00:00:00Z', // Expired
      };

      // Mock para buscar la clave API
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockApiKey,
        error: null,
      });

      // Act & Assert
      await expect(service.validateApiKey(apiKey))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for an inactive API key', async () => {
      // Arrange
      const apiKey = 'inactive-api-key';
      const mockApiKey = {
        id: 'api-key-1',
        name: 'Test API Key',
        key: apiKey,
        company_id: 'company-1',
        created_by: 'user-1',
        status: ApiKeyStatus.REVOKED,
        created_at: '2023-01-01T00:00:00Z',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Still valid but revoked
      };

      // Mock para buscar la clave API
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockApiKey,
        error: null,
      });

      // Act & Assert
      await expect(service.validateApiKey(apiKey))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      // Arrange
      const keyId = 'api-key-1';
      const userId = 'user-1';
      const companyId = 'company-1';

      // Mock para verificar que la clave existe
      jest.spyOn(service, 'getApiKeyById').mockResolvedValue({
        id: keyId,
        name: 'Test API Key',
        companyId: companyId,
        status: ApiKeyStatus.ACTIVE,
        createdBy: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z',
      } as ApiKeyDto);

      // Mock para actualizar la clave API
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: keyId,
          name: 'Test API Key',
          company_id: companyId,
          status: ApiKeyStatus.REVOKED,
        },
        error: null,
      });

      // Act
      const result = await service.revokeApiKey(keyId, companyId, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('api_key');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        status: ApiKeyStatus.REVOKED,
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', keyId);
      expect(mockAuditService.log).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        id: keyId,
        status: ApiKeyStatus.REVOKED,
      }));
    });

    it('should throw NotFoundException when API key does not exist', async () => {
      // Arrange
      const keyId = 'non-existent-key';
      const userId = 'user-1';
      const companyId = 'company-1';

      // Mock para simular que no se encuentra la clave
      jest.spyOn(service, 'getApiKeyById').mockRejectedValue(
        new NotFoundException(`API key with id ${keyId} not found`)
      );

      // Act & Assert
      await expect(service.revokeApiKey(keyId, companyId, userId))
        .rejects.toThrow(NotFoundException);
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });
}); 