import { Test, TestingModule } from '@nestjs/testing';
import { ConsentDataTypesController } from './consent-data-types.controller';
import { ConsentDataTypesService } from './consent-data-types.service';
import { 
  ConsentDataTypeDto, 
  ConsentDataTypeStatus, 
  CreateConsentDataTypeDto, 
  UpdateConsentDataTypeDto 
} from './dto';
import { NotFoundException } from '@nestjs/common';

describe('ConsentDataTypesController', () => {
  let controller: ConsentDataTypesController;
  let service: ConsentDataTypesService;

  // Mock del servicio
  const mockConsentDataTypesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // Usuario de prueba
  const mockUserId = 'test-user-id';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsentDataTypesController],
      providers: [
        {
          provide: ConsentDataTypesService,
          useValue: mockConsentDataTypesService,
        },
      ],
    }).compile();

    controller = module.get<ConsentDataTypesController>(ConsentDataTypesController);
    service = module.get<ConsentDataTypesService>(ConsentDataTypesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new consent data type', async () => {
      // Datos de prueba
      const createDto: CreateConsentDataTypeDto = {
        consentId: 'consent-1',
        dataTypeId: 'data-type-1',
        status: ConsentDataTypeStatus.ACTIVE,
        metadata: { purpose: 'marketing' }
      };

      // Respuesta esperada
      const expectedResponse: ConsentDataTypeDto = {
        id: 'cdt-1',
        consentId: createDto.consentId,
        dataTypeId: createDto.dataTypeId,
        status: ConsentDataTypeStatus.ACTIVE,
        metadata: createDto.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Configurar mock
      mockConsentDataTypesService.create.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.create(createDto, mockUserId);

      // Assert
      expect(mockConsentDataTypesService.create).toHaveBeenCalledWith(createDto, mockUserId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findAll', () => {
    it('should return all consent data types for a consent', async () => {
      // Datos de prueba
      const consentId = 'consent-1';

      // Respuesta esperada
      const expectedResponse: ConsentDataTypeDto[] = [
        {
          id: 'cdt-1',
          consentId,
          dataTypeId: 'data-type-1',
          status: ConsentDataTypeStatus.ACTIVE,
          metadata: { purpose: 'marketing' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cdt-2',
          consentId,
          dataTypeId: 'data-type-2',
          status: ConsentDataTypeStatus.ACTIVE,
          metadata: { purpose: 'analytics' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Configurar mock
      mockConsentDataTypesService.findAll.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.findAll(consentId);

      // Assert
      expect(mockConsentDataTypesService.findAll).toHaveBeenCalledWith(consentId);
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no consent data types exist', async () => {
      // Datos de prueba
      const consentId = 'consent-nonexistent';

      // Configurar mock
      mockConsentDataTypesService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll(consentId);

      // Assert
      expect(mockConsentDataTypesService.findAll).toHaveBeenCalledWith(consentId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a single consent data type by id', async () => {
      // Datos de prueba
      const id = 'cdt-1';

      // Respuesta esperada
      const expectedResponse: ConsentDataTypeDto = {
        id,
        consentId: 'consent-1',
        dataTypeId: 'data-type-1',
        status: ConsentDataTypeStatus.ACTIVE,
        metadata: { purpose: 'marketing' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Configurar mock
      mockConsentDataTypesService.findOne.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(mockConsentDataTypesService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NotFoundException when consent data type not found', async () => {
      // Datos de prueba
      const id = 'nonexistent-id';

      // Configurar mock
      const error = new NotFoundException(`Consent data type with ID ${id} not found`);
      mockConsentDataTypesService.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a consent data type', async () => {
      // Datos de prueba
      const id = 'cdt-1';
      const updateDto: UpdateConsentDataTypeDto = {
        status: ConsentDataTypeStatus.INACTIVE,
        metadata: { purpose: 'updated-purpose' }
      };

      // Respuesta esperada
      const expectedResponse: ConsentDataTypeDto = {
        id,
        consentId: 'consent-1',
        dataTypeId: 'data-type-1',
        status: ConsentDataTypeStatus.INACTIVE,
        metadata: updateDto.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Configurar mock
      mockConsentDataTypesService.update.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.update(id, updateDto, mockUserId);

      // Assert
      expect(mockConsentDataTypesService.update).toHaveBeenCalledWith(id, updateDto, mockUserId);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NotFoundException when updating non-existent consent data type', async () => {
      // Datos de prueba
      const id = 'nonexistent-id';
      const updateDto: UpdateConsentDataTypeDto = {
        status: ConsentDataTypeStatus.INACTIVE
      };

      // Configurar mock
      const error = new NotFoundException(`Consent data type with ID ${id} not found`);
      mockConsentDataTypesService.update.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.update(id, updateDto, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a consent data type (mark as DELETED)', async () => {
      // Datos de prueba
      const id = 'cdt-1';

      // Configurar mock
      mockConsentDataTypesService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(id, mockUserId);

      // Assert
      expect(mockConsentDataTypesService.remove).toHaveBeenCalledWith(id, mockUserId);
    });

    it('should throw NotFoundException when removing non-existent consent data type', async () => {
      // Datos de prueba
      const id = 'nonexistent-id';

      // Configurar mock
      const error = new NotFoundException(`Consent data type with ID ${id} not found`);
      mockConsentDataTypesService.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.remove(id, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });
});
