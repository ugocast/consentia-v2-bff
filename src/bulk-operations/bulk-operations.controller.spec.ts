import { Test, TestingModule } from '@nestjs/testing';
import { BulkOperationsController } from './bulk-operations.controller';
import { BulkOperationsService } from './bulk-operations.service';
import { 
  BulkOperationDto,
  CreateBulkOperationDto,
  UpdateBulkOperationDto,
  ProcessBulkOperationDto
} from './dto';
import { NotFoundException } from '@nestjs/common';

describe('BulkOperationsController', () => {
  let controller: BulkOperationsController;
  let service: BulkOperationsService;

  // Mock data
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockBulkOpId = 'bulkop-123';

  const mockBulkOperation: BulkOperationDto = {
    id: mockBulkOpId,
    type: 'create_consent',
    items: [{ dataSubjectId: 'subject-1' }],
    status: 'PENDING',
    created_at: '2023-01-01T00:00:00Z',
    created_by: mockUserId,
    company_id: mockCompanyId,
    metadata: { source: 'csv-import' },
    comments: 'Test bulk operation'
  };

  const mockCreateDto: CreateBulkOperationDto = {
    type: 'create_consent',
    items: [{ dataSubjectId: 'subject-1' }],
    metadata: { source: 'csv-import' },
    description: 'Test bulk operation'
  };

  const mockUpdateDto: UpdateBulkOperationDto = {
    metadata: { source: 'updated-source' }
  };

  const mockProcessDto: ProcessBulkOperationDto = {
    metadata: { dryRun: false },
    comments: 'Processing bulk operation'
  };

  // Setup mock service
  const mockBulkOperationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    processBulkOperation: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkOperationsController],
      providers: [
        {
          provide: BulkOperationsService,
          useValue: mockBulkOperationsService,
        },
      ],
    }).compile();

    controller = module.get<BulkOperationsController>(BulkOperationsController);
    service = module.get<BulkOperationsService>(BulkOperationsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new bulk operation', async () => {
      // Arrange
      mockBulkOperationsService.create.mockResolvedValue(mockBulkOperation);

      // Act
      const result = await controller.create(mockCompanyId, mockCreateDto, mockUserId);

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        mockCompanyId,
        mockCreateDto,
        mockUserId
      );
      expect(result).toEqual(mockBulkOperation);
    });

    it('should handle service errors when creating bulk operation', async () => {
      // Arrange
      const errorMessage = 'Error creating bulk operation';
      mockBulkOperationsService.create.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.create(mockCompanyId, mockCreateDto, mockUserId)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('processBulkOperation', () => {
    it('should process a bulk operation', async () => {
      // Arrange
      const processedOperation = {
        ...mockBulkOperation,
        status: 'PROCESSING'
      };
      mockBulkOperationsService.processBulkOperation.mockResolvedValue(processedOperation);

      // Act
      const result = await controller.processBulkOperation(
        mockCompanyId,
        mockBulkOpId,
        mockProcessDto,
        mockUserId
      );

      // Assert
      expect(service.processBulkOperation).toHaveBeenCalledWith(
        mockCompanyId,
        mockBulkOpId,
        mockProcessDto,
        mockUserId
      );
      expect(result).toEqual(processedOperation);
      expect(result.status).toEqual('PROCESSING');
    });

    it('should handle not found errors when processing', async () => {
      // Arrange
      const errorMessage = `Bulk operation with ID ${mockBulkOpId} not found`;
      mockBulkOperationsService.processBulkOperation.mockRejectedValue(
        new NotFoundException(errorMessage)
      );

      // Act & Assert
      await expect(
        controller.processBulkOperation(mockCompanyId, mockBulkOpId, mockProcessDto, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all bulk operations', async () => {
      // Arrange
      const operations = [mockBulkOperation];
      mockBulkOperationsService.findAll.mockResolvedValue(operations);

      // Act
      const result = await controller.findAll(mockCompanyId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockCompanyId, {});
      expect(result).toEqual(operations);
    });

    it('should filter by status and type', async () => {
      // Arrange
      const status = 'PENDING';
      const type = 'create_consent';
      const operations = [mockBulkOperation];
      mockBulkOperationsService.findAll.mockResolvedValue(operations);

      // Act
      const result = await controller.findAll(mockCompanyId, status, type);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockCompanyId, { status, type });
      expect(result).toEqual(operations);
    });

    it('should return empty array when no operations exist', async () => {
      // Arrange
      mockBulkOperationsService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll(mockCompanyId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a specific bulk operation', async () => {
      // Arrange
      mockBulkOperationsService.findOne.mockResolvedValue(mockBulkOperation);

      // Act
      const result = await controller.findOne(mockCompanyId, mockBulkOpId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockCompanyId, mockBulkOpId);
      expect(result).toEqual(mockBulkOperation);
    });

    it('should handle not found errors', async () => {
      // Arrange
      const errorMessage = `Bulk operation with ID ${mockBulkOpId} not found`;
      mockBulkOperationsService.findOne.mockRejectedValue(
        new NotFoundException(errorMessage)
      );

      // Act & Assert
      await expect(
        controller.findOne(mockCompanyId, mockBulkOpId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a bulk operation', async () => {
      // Arrange
      const updatedOperation = {
        ...mockBulkOperation,
        ...mockUpdateDto,
        metadata: { source: 'updated-source' }
      };
      mockBulkOperationsService.update.mockResolvedValue(updatedOperation);

      // Act
      const result = await controller.update(
        mockCompanyId,
        mockBulkOpId,
        mockUpdateDto,
        mockUserId
      );

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        mockCompanyId,
        mockBulkOpId,
        mockUpdateDto,
        mockUserId
      );
      expect(result).toEqual(updatedOperation);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.source).toEqual('updated-source');
    });
  });

  describe('updateStatus', () => {
    it('should update a bulk operation status', async () => {
      // Arrange
      const status = 'COMPLETED';
      const statusUpdatedOperation = {
        ...mockBulkOperation,
        status: 'COMPLETED'
      };
      mockBulkOperationsService.updateStatus.mockResolvedValue(statusUpdatedOperation);

      // Act
      const result = await controller.updateStatus(
        mockCompanyId,
        mockBulkOpId,
        status,
        mockUserId
      );

      // Assert
      expect(service.updateStatus).toHaveBeenCalledWith(
        mockCompanyId,
        mockBulkOpId,
        status,
        mockUserId
      );
      expect(result).toEqual(statusUpdatedOperation);
      expect(result.status).toEqual('COMPLETED');
    });
  });

  describe('remove', () => {
    it('should delete a bulk operation', async () => {
      // Arrange
      mockBulkOperationsService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(mockCompanyId, mockBulkOpId, mockUserId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(
        mockCompanyId,
        mockBulkOpId,
        mockUserId
      );
    });

    it('should handle not found errors during removal', async () => {
      // Arrange
      const errorMessage = `Bulk operation with ID ${mockBulkOpId} not found`;
      mockBulkOperationsService.remove.mockRejectedValue(
        new NotFoundException(errorMessage)
      );

      // Act & Assert
      await expect(
        controller.remove(mockCompanyId, mockBulkOpId, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
