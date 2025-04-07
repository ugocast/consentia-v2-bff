import { Test, TestingModule } from '@nestjs/testing';
import { ConsentDataTypesService } from './consent-data-types.service';
import { AuditService } from '../common/audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import { 
  ConsentDataTypeDto, 
  ConsentDataTypeStatus, 
  CreateConsentDataTypeDto, 
  UpdateConsentDataTypeDto 
} from './dto';

jest.mock('./consent-data-types.service');

describe('ConsentDataTypesService', () => {
  let service: ConsentDataTypesService;
  
  // Mock del servicio de auditoría
  const mockAuditService = {
    log: jest.fn().mockImplementation(() => Promise.resolve()),
  };

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentDataTypesService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ConsentDataTypesService>(ConsentDataTypesService);
    
    // Reestablecemos las implementaciones de los mocks después de cada prueba
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a consent data type', async () => {
      // Datos de prueba
      const createDto: CreateConsentDataTypeDto = {
        consentId: 'consent-1',
        dataTypeId: 'data-type-1',
        status: ConsentDataTypeStatus.ACTIVE,
        metadata: { purpose: 'marketing' }
      };
      const userId = 'user-1';
      
      // Respuesta esperada
      const expectedResponse: ConsentDataTypeDto = {
        id: 'cdt-1',
        consentId: createDto.consentId,
        dataTypeId: createDto.dataTypeId,
        status: createDto.status ?? ConsentDataTypeStatus.ACTIVE,
        metadata: createDto.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Configurar mock
      (service.create as jest.Mock).mockResolvedValue(expectedResponse);
      
      // Act
      const result = await service.create(createDto, userId);
      
      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto, userId);
      expect(result).toEqual(expectedResponse);
      expect(result.id).toBe('cdt-1');
      expect(result.consentId).toBe(createDto.consentId);
      expect(result.dataTypeId).toBe(createDto.dataTypeId);
      expect(result.status).toBe(ConsentDataTypeStatus.ACTIVE);
      expect(result.metadata).toEqual(createDto.metadata);
    });

    it('should handle errors during creation', async () => {
      // Datos de prueba
      const createDto: CreateConsentDataTypeDto = {
        consentId: 'consent-1',
        dataTypeId: 'data-type-1'
      };
      const userId = 'user-1';
      
      // Configurar mock para simular error
      const error = new Error('Database error');
      (service.create as jest.Mock).mockRejectedValue(error);
      
      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should retrieve all consent data types for a consent', async () => {
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
      (service.findAll as jest.Mock).mockResolvedValue(expectedResponse);
      
      // Act
      const result = await service.findAll(consentId);
      
      // Assert
      expect(service.findAll).toHaveBeenCalledWith(consentId);
      expect(result).toEqual(expectedResponse);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cdt-1');
      expect(result[1].id).toBe('cdt-2');
      expect(result.every(item => item.consentId === consentId)).toBe(true);
    });

    it('should return an empty array when no consent data types exist', async () => {
      // Datos de prueba
      const consentId = 'consent-nonexistent';
      
      // Configurar mock
      (service.findAll as jest.Mock).mockResolvedValue([]);
      
      // Act
      const result = await service.findAll(consentId);
      
      // Assert
      expect(service.findAll).toHaveBeenCalledWith(consentId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle errors when retrieving consent data types', async () => {
      // Datos de prueba
      const consentId = 'consent-1';
      
      // Configurar mock para simular error
      const error = new Error('Database error');
      (service.findAll as jest.Mock).mockRejectedValue(error);
      
      // Act & Assert
      await expect(service.findAll(consentId)).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should retrieve a consent data type by id', async () => {
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
      (service.findOne as jest.Mock).mockResolvedValue(expectedResponse);
      
      // Act
      const result = await service.findOne(id);
      
      // Assert
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResponse);
      expect(result.id).toBe(id);
    });

    it('should throw NotFoundException when consent data type not found', async () => {
      // Datos de prueba
      const id = 'nonexistent-id';
      
      // Configurar mock
      const error = new NotFoundException(`Consent data type with ID ${id} not found`);
      (service.findOne as jest.Mock).mockRejectedValue(error);
      
      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(`Consent data type with ID ${id} not found`);
    });
  });

  describe('update', () => {
    it('should update a consent data type successfully', async () => {
      // Datos de prueba
      const id = 'cdt-1';
      const updateDto: UpdateConsentDataTypeDto = {
        status: ConsentDataTypeStatus.INACTIVE,
        metadata: { purpose: 'updated-purpose' }
      };
      const userId = 'user-1';
      
      // Respuesta esperada
      const expectedResponse: ConsentDataTypeDto = {
        id,
        consentId: 'consent-1',
        dataTypeId: 'data-type-1',
        status: updateDto.status ?? ConsentDataTypeStatus.ACTIVE,
        metadata: updateDto.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Configurar mock
      (service.update as jest.Mock).mockResolvedValue(expectedResponse);
      
      // Act
      const result = await service.update(id, updateDto, userId);
      
      // Assert
      expect(service.update).toHaveBeenCalledWith(id, updateDto, userId);
      expect(result).toEqual(expectedResponse);
      expect(result.id).toBe(id);
      expect(result.status).toBe(ConsentDataTypeStatus.INACTIVE);
      expect(result.metadata).toEqual(updateDto.metadata);
    });

    it('should throw NotFoundException when updating non-existent consent data type', async () => {
      // Datos de prueba
      const id = 'nonexistent-id';
      const updateDto: UpdateConsentDataTypeDto = {
        status: ConsentDataTypeStatus.INACTIVE
      };
      const userId = 'user-1';
      
      // Configurar mock
      const error = new NotFoundException(`Consent data type with ID ${id} not found`);
      (service.update as jest.Mock).mockRejectedValue(error);
      
      // Act & Assert
      await expect(service.update(id, updateDto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should mark a consent data type as DELETED', async () => {
      // Datos de prueba
      const id = 'cdt-1';
      const userId = 'user-1';
      
      // Configurar mock
      (service.remove as jest.Mock).mockResolvedValue(undefined);
      
      // Act
      await service.remove(id, userId);
      
      // Assert
      expect(service.remove).toHaveBeenCalledWith(id, userId);
    });

    it('should throw NotFoundException when removing non-existent consent data type', async () => {
      // Datos de prueba
      const id = 'nonexistent-id';
      const userId = 'user-1';
      
      // Configurar mock
      const error = new NotFoundException(`Consent data type with ID ${id} not found`);
      (service.remove as jest.Mock).mockRejectedValue(error);
      
      // Act & Assert
      await expect(service.remove(id, userId)).rejects.toThrow(NotFoundException);
    });
  });
});
