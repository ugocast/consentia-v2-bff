import { Test, TestingModule } from '@nestjs/testing';
import { DataTypesController } from './data-types.controller';
import { DataTypesService } from './data-types.service';
import { CreateDataTypeDto, DataType, DataTypeStatus, UpdateDataTypeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotFoundException } from '@nestjs/common';

// Mock del servicio de tipos de datos
const mockDataTypesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Mock de los guards
const mockJwtAuthGuard = {
  canActivate: jest.fn().mockImplementation(() => true),
};

const mockRolesGuard = {
  canActivate: jest.fn().mockImplementation(() => true),
};

describe('DataTypesController', () => {
  let controller: DataTypesController;
  let service: DataTypesService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataTypesController],
      providers: [
        {
          provide: DataTypesService,
          useValue: mockDataTypesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<DataTypesController>(DataTypesController);
    service = module.get<DataTypesService>(DataTypesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a data type', async () => {
      // Arrange
      const userId = 'test-user-id';
      const createDto: CreateDataTypeDto = {
        name: 'Email Address',
        code: 'EMAIL',
        description: 'User email address',
        type: DataType.EMAIL,
        required: true,
        unique: true,
        sensitive: true,
      };
      
      const mockResult = {
        id: 'test-data-type-id',
        companyId: 'test-company-id',
        name: createDto.name,
        code: createDto.code,
        description: createDto.description,
        type: createDto.type,
        required: createDto.required,
        unique: createDto.unique,
        sensitive: createDto.sensitive,
        status: DataTypeStatus.ACTIVE,
        version: 1,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDataTypesService.create.mockResolvedValue(mockResult);

      // Act
      const result = await controller.create(createDto, userId);

      // Assert
      expect(mockDataTypesService.create).toHaveBeenCalledWith(createDto, userId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of data types', async () => {
      // Arrange
      const mockResult = [
        {
          id: 'data-type-1',
          companyId: 'company-1',
          name: 'Email',
          code: 'EMAIL',
          type: DataType.EMAIL,
          status: DataTypeStatus.ACTIVE,
        },
        {
          id: 'data-type-2',
          companyId: 'company-1',
          name: 'Phone',
          code: 'PHONE',
          type: DataType.PHONE,
          status: DataTypeStatus.ACTIVE,
        },
      ];

      mockDataTypesService.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockDataTypesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no data types exist', async () => {
      // Arrange
      mockDataTypesService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockDataTypesService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single data type', async () => {
      // Arrange
      const id = 'test-data-type-id';
      const mockResult = {
        id,
        companyId: 'company-1',
        name: 'Email',
        code: 'EMAIL',
        type: DataType.EMAIL,
        status: DataTypeStatus.ACTIVE,
      };

      mockDataTypesService.findOne.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(mockDataTypesService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException when data type does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      mockDataTypesService.findOne.mockRejectedValue(new NotFoundException(`Data type with ID ${id} not found`));

      // Act & Assert
      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(mockDataTypesService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a data type', async () => {
      // Arrange
      const id = 'test-data-type-id';
      const userId = 'test-user-id';
      const updateDto: UpdateDataTypeDto = {
        name: 'Updated Email',
        description: 'Updated description',
      };
      
      const mockResult = {
        id,
        companyId: 'company-1',
        name: updateDto.name,
        code: 'EMAIL',
        description: updateDto.description,
        type: DataType.EMAIL,
        status: DataTypeStatus.ACTIVE,
        version: 2,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      };

      mockDataTypesService.update.mockResolvedValue(mockResult);

      // Act
      const result = await controller.update(id, updateDto, userId);

      // Assert
      expect(mockDataTypesService.update).toHaveBeenCalledWith(id, updateDto, userId);
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException when data type to update does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      const userId = 'test-user-id';
      const updateDto: UpdateDataTypeDto = {
        name: 'Updated Email',
      };
      
      mockDataTypesService.update.mockRejectedValue(new NotFoundException(`Data type with ID ${id} not found`));

      // Act & Assert
      await expect(controller.update(id, updateDto, userId)).rejects.toThrow(NotFoundException);
      expect(mockDataTypesService.update).toHaveBeenCalledWith(id, updateDto, userId);
    });
  });

  describe('remove', () => {
    it('should delete a data type', async () => {
      // Arrange
      const id = 'test-data-type-id';
      const userId = 'test-user-id';
      
      mockDataTypesService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(id, userId);

      // Assert
      expect(mockDataTypesService.remove).toHaveBeenCalledWith(id, userId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when data type to delete does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      const userId = 'test-user-id';
      
      mockDataTypesService.remove.mockRejectedValue(new NotFoundException(`Data type with ID ${id} not found`));

      // Act & Assert
      await expect(controller.remove(id, userId)).rejects.toThrow(NotFoundException);
      expect(mockDataTypesService.remove).toHaveBeenCalledWith(id, userId);
    });
  });
});
