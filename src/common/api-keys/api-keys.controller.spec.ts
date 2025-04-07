import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { JwtGuard } from '../../auth/jwt/jwt.guard';
import { ApiKeyStatus, ApiKeyDto, CreateApiKeyDto } from './dto';
import { Request } from 'express';

// Mock del servicio de claves API
const mockApiKeysService = {
  createApiKey: jest.fn(),
  getApiKeys: jest.fn(),
  getApiKeyById: jest.fn(),
  revokeApiKey: jest.fn(),
};

// Mock del guard de autenticación
const mockJwtGuard = {
  canActivate: jest.fn().mockImplementation(() => true),
};

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  let service: ApiKeysService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should create a new API key', async () => {
      // Arrange
      const createDto: CreateApiKeyDto = {
        name: 'Test API Key',
        companyId: 'company-1',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      };

      const mockRequest = {
        user: { id: 'user-1' }
      } as unknown as Request;

      const mockResult: ApiKeyDto = {
        id: 'api-key-1',
        name: createDto.name,
        key: 'generated-api-key-value',
        companyId: createDto.companyId,
        status: ApiKeyStatus.ACTIVE,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        expiresAt: createDto.expiresAt,
      };

      mockApiKeysService.createApiKey.mockResolvedValue(mockResult);

      // Act
      const result = await controller.createApiKey(createDto, mockRequest);

      // Assert
      expect(service.createApiKey).toHaveBeenCalledWith(createDto, 'user-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getApiKeys', () => {
    it('should return all API keys for a company', async () => {
      // Arrange
      const companyId = 'company-1';
      const mockResults: ApiKeyDto[] = [
        {
          id: 'api-key-1',
          name: 'Test API Key 1',
          companyId,
          status: ApiKeyStatus.ACTIVE,
          createdBy: 'user-1',
          createdAt: '2023-01-01T00:00:00Z',
          expiresAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'api-key-2',
          name: 'Test API Key 2',
          companyId,
          status: ApiKeyStatus.ACTIVE,
          createdBy: 'user-1',
          createdAt: '2023-01-02T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
        },
      ];

      mockApiKeysService.getApiKeys.mockResolvedValue(mockResults);

      // Act
      const result = await controller.getApiKeys(companyId);

      // Assert
      expect(service.getApiKeys).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(mockResults);
    });

    it('should return an empty array when no keys are found', async () => {
      // Arrange
      const companyId = 'company-no-keys';
      
      mockApiKeysService.getApiKeys.mockResolvedValue([]);

      // Act
      const result = await controller.getApiKeys(companyId);

      // Assert
      expect(service.getApiKeys).toHaveBeenCalledWith(companyId);
      expect(result).toEqual([]);
    });
  });

  describe('getApiKeyById', () => {
    it('should return an API key by ID', async () => {
      // Arrange
      const keyId = 'api-key-1';
      const companyId = 'company-1';
      const mockResult: ApiKeyDto = {
        id: keyId,
        name: 'Test API Key',
        companyId,
        status: ApiKeyStatus.ACTIVE,
        createdBy: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z',
      };

      mockApiKeysService.getApiKeyById.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getApiKeyById(keyId, companyId);

      // Assert
      expect(service.getApiKeyById).toHaveBeenCalledWith(keyId, companyId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      // Arrange
      const keyId = 'api-key-1';
      const companyId = 'company-1';
      
      const mockRequest = {
        user: { id: 'user-1' }
      } as unknown as Request;

      const mockResult: ApiKeyDto = {
        id: keyId,
        name: 'Test API Key',
        companyId,
        status: ApiKeyStatus.REVOKED,
        createdBy: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z',
      };

      mockApiKeysService.revokeApiKey.mockResolvedValue(mockResult);

      // Act
      const result = await controller.revokeApiKey(keyId, companyId, mockRequest);

      // Assert
      expect(service.revokeApiKey).toHaveBeenCalledWith(keyId, companyId, 'user-1');
      expect(result).toEqual(mockResult);
    });
  });
}); 