import { Test, TestingModule } from '@nestjs/testing';
import { ExternalIntegrationsController } from './external-integrations.controller';
import { ExternalIntegrationsService } from './external-integrations.service';
import { 
  ExternalIntegrationDto, 
  CreateExternalIntegrationDto, 
  UpdateExternalIntegrationDto,
  ExternalIntegrationStatus 
} from './dto';
import { NotFoundException } from '@nestjs/common';

describe('ExternalIntegrationsController', () => {
  let controller: ExternalIntegrationsController;
  let service: ExternalIntegrationsService;

  const mockExternalIntegrationDto: ExternalIntegrationDto = {
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

  const mockCreateDto: CreateExternalIntegrationDto = {
    name: 'Test Integration',
    type: 'CRM',
    endpoint: 'https://example.com/api',
    apiKey: 'api-key-123',
    metadata: { webhookUrl: 'https://example.com/webhook' },
  };

  const mockUpdateDto: UpdateExternalIntegrationDto = {
    name: 'Updated Integration',
    endpoint: 'https://example.com/api/v2',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExternalIntegrationsController],
      providers: [
        {
          provide: ExternalIntegrationsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockExternalIntegrationDto),
            findAll: jest.fn().mockResolvedValue([mockExternalIntegrationDto]),
            findOne: jest.fn().mockResolvedValue(mockExternalIntegrationDto),
            update: jest.fn().mockResolvedValue({
              ...mockExternalIntegrationDto,
              name: 'Updated Integration',
              endpoint: 'https://example.com/api/v2',
            }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<ExternalIntegrationsController>(ExternalIntegrationsController);
    service = module.get<ExternalIntegrationsService>(ExternalIntegrationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new external integration', async () => {
      const companyId = 'test-company-id';
      const userId = 'user-123';

      const result = await controller.create(mockCreateDto, companyId, userId);

      expect(service.create).toHaveBeenCalledWith(companyId, mockCreateDto, userId);
      expect(result).toEqual(mockExternalIntegrationDto);
    });

    it('should handle service errors when creating integration', async () => {
      const companyId = 'test-company-id';
      const userId = 'user-123';
      
      // Setup service to throw an error
      jest.spyOn(service, 'create').mockRejectedValueOnce(new Error('Creation failed'));
      
      // Verify the controller propagates the error
      await expect(controller.create(mockCreateDto, companyId, userId))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('findAll', () => {
    it('should return all external integrations for a company', async () => {
      const companyId = 'test-company-id';

      const result = await controller.findAll(companyId);

      expect(service.findAll).toHaveBeenCalledWith(companyId);
      expect(result).toEqual([mockExternalIntegrationDto]);
    });

    it('should return empty array when no integrations exist', async () => {
      const companyId = 'test-company-id';
      
      // Setup service to return empty array
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([]);
      
      const result = await controller.findAll(companyId);
      
      expect(service.findAll).toHaveBeenCalledWith(companyId);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a specific external integration by ID', async () => {
      const id = 'test-id';
      const companyId = 'test-company-id';

      const result = await controller.findOne(id, companyId);

      expect(service.findOne).toHaveBeenCalledWith(companyId, id);
      expect(result).toEqual(mockExternalIntegrationDto);
    });

    it('should handle not found errors', async () => {
      const id = 'non-existent-id';
      const companyId = 'test-company-id';
      
      // Setup service to throw NotFoundException
      const notFoundError = new NotFoundException(`External integration with ID ${id} not found`);
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(notFoundError);
      
      // Verify the controller propagates the error
      await expect(controller.findOne(id, companyId))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an external integration', async () => {
      const id = 'test-id';
      const companyId = 'test-company-id';
      const userId = 'user-123';

      const result = await controller.update(id, mockUpdateDto, companyId, userId);

      expect(service.update).toHaveBeenCalledWith(companyId, id, mockUpdateDto, userId);
      expect(result.name).toEqual('Updated Integration');
      expect(result.endpoint).toEqual('https://example.com/api/v2');
    });

    it('should handle not found errors during update', async () => {
      const id = 'non-existent-id';
      const companyId = 'test-company-id';
      const userId = 'user-123';
      
      // Setup service to throw NotFoundException
      const notFoundError = new NotFoundException(`External integration with ID ${id} not found`);
      jest.spyOn(service, 'update').mockRejectedValueOnce(notFoundError);
      
      // Verify the controller propagates the error
      await expect(controller.update(id, mockUpdateDto, companyId, userId))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an external integration', async () => {
      const id = 'test-id';
      const companyId = 'test-company-id';
      const userId = 'user-123';

      await controller.remove(id, companyId, userId);

      expect(service.remove).toHaveBeenCalledWith(companyId, id, userId);
    });

    it('should handle not found errors during removal', async () => {
      const id = 'non-existent-id';
      const companyId = 'test-company-id';
      const userId = 'user-123';
      
      // Setup service to throw NotFoundException
      const notFoundError = new NotFoundException(`External integration with ID ${id} not found`);
      jest.spyOn(service, 'remove').mockRejectedValueOnce(notFoundError);
      
      // Verify the controller propagates the error
      await expect(controller.remove(id, companyId, userId))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
