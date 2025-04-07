import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataTypesService } from './data-types.service';
import { mockSupabaseClient, mockCreateSupabaseClient } from '../common/mocks/supabase.mock';
import { AuditService } from '../common/audit/audit.service';
import { CreateDataTypeDto, DataType, DataTypeStatus, UpdateDataTypeDto } from './dto';

// Mock del servicio de auditoría
const mockAuditService = {
  log: jest.fn().mockResolvedValue({}),
};

describe('DataTypesService', () => {
  let service: DataTypesService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataTypesService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        }
      ],
    }).compile();

    service = module.get<DataTypesService>(DataTypesService);

    // Configurar el mock para createSupabaseClient usando as unknown as para evitar errores de tipo
    mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof mockCreateSupabaseClient>);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new data type', async () => {
      // Arrange
      const createDto: CreateDataTypeDto = {
        name: 'Email Address',
        code: 'EMAIL',
        description: 'User email address',
        type: DataType.EMAIL,
        required: true,
        unique: true,
        sensitive: true,
        status: DataTypeStatus.ACTIVE,
        metadata: { category: 'personal' }
      };
      
      const userId = 'test-user-id';
      
      const mockResponse = {
        id: 'test-data-type-id',
        company_id: 'test-company-id',
        name: createDto.name,
        code: createDto.code,
        description: createDto.description,
        type: createDto.type,
        required: createDto.required,
        unique: createDto.unique,
        sensitive: createDto.sensitive,
        active: true,
        version: 1,
        status: createDto.status,
        metadata: createDto.metadata,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Configurar mocks de Supabase
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.single.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('data_types');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: createDto.name,
        code: createDto.code,
        description: createDto.description,
        type: createDto.type,
        required: createDto.required,
        unique: createDto.unique,
        sensitive: createDto.sensitive,
        status: createDto.status,
        created_by: userId,
        updated_by: userId
      }));
      
      expect(mockAuditService.log).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        id: mockResponse.id,
        companyId: mockResponse.company_id,
        name: mockResponse.name,
        code: mockResponse.code,
        description: mockResponse.description,
        type: mockResponse.type,
        required: mockResponse.required,
        unique: mockResponse.unique,
        sensitive: mockResponse.sensitive,
        status: mockResponse.status,
        metadata: mockResponse.metadata,
        createdBy: mockResponse.created_by,
        updatedBy: mockResponse.updated_by,
        createdAt: mockResponse.created_at,
        updatedAt: mockResponse.updated_at
      }));
    });

    it('should throw an error when Supabase fails', async () => {
      // Arrange
      const createDto: CreateDataTypeDto = {
        name: 'Email Address',
        code: 'EMAIL',
        type: DataType.EMAIL
      };
      
      const userId = 'test-user-id';
      
      // Configurar mocks de Supabase para error
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Supabase error' }
      });

      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toEqual(
        expect.objectContaining({ message: 'Supabase error' })
      );
      
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of data types', async () => {
      // Arrange
      const mockResponse = [
        {
          id: 'data-type-1',
          company_id: 'company-1',
          name: 'Email',
          code: 'EMAIL',
          type: DataType.EMAIL,
          status: DataTypeStatus.ACTIVE,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        },
        {
          id: 'data-type-2',
          company_id: 'company-1',
          name: 'Phone',
          code: 'PHONE',
          type: DataType.PHONE,
          status: DataTypeStatus.ACTIVE,
          created_at: '2023-01-02',
          updated_at: '2023-01-02'
        }
      ];
      
      // Configurar mocks de Supabase
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('data_types');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockResponse[0].id,
        companyId: mockResponse[0].company_id,
        name: mockResponse[0].name,
        code: mockResponse[0].code,
        type: mockResponse[0].type,
        status: mockResponse[0].status
      }));
    });

    it('should throw an error when Supabase fails', async () => {
      // Configurar mocks de Supabase para error
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Supabase error' }
      });

      // Act & Assert
      await expect(service.findAll()).rejects.toEqual(
        expect.objectContaining({ message: 'Supabase error' })
      );
    });
  });

  describe('findOne', () => {
    it('should return a single data type by ID', async () => {
      // Arrange
      const id = 'test-data-type-id';
      const mockResponse = {
        id,
        company_id: 'company-1',
        name: 'Email',
        code: 'EMAIL',
        type: DataType.EMAIL,
        status: DataTypeStatus.ACTIVE,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };
      
      // Configurar mocks de Supabase
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockResolvedValue({
        data: mockResponse,
        error: null
      });

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('data_types');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', id);
      
      expect(result).toEqual(expect.objectContaining({
        id: mockResponse.id,
        companyId: mockResponse.company_id,
        name: mockResponse.name,
        code: mockResponse.code,
        type: mockResponse.type,
        status: mockResponse.status
      }));
    });

    it('should throw NotFoundException when data type is not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      
      // Configurar mocks de Supabase para not found
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a data type', async () => {
      // Arrange
      const id = 'test-data-type-id';
      const updateDto: UpdateDataTypeDto = {
        name: 'Updated Email',
        description: 'Updated description'
      };
      const userId = 'test-user-id';
      
      const currentDataType = {
        id,
        company_id: 'company-1',
        name: 'Email',
        code: 'EMAIL',
        type: DataType.EMAIL,
        version: 1,
        status: DataTypeStatus.ACTIVE,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };
      
      const updatedDataType = {
        ...currentDataType,
        name: updateDto.name,
        description: updateDto.description,
        version: 2,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };
      
      // Configurar mock para findOne
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: currentDataType.id,
        companyId: currentDataType.company_id,
        name: currentDataType.name,
        code: currentDataType.code,
        type: currentDataType.type,
        version: currentDataType.version,
        status: currentDataType.status,
        createdAt: currentDataType.created_at,
        updatedAt: currentDataType.updated_at
      } as any);
      
      // Configurar mocks de Supabase para update
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.single.mockResolvedValue({
        data: updatedDataType,
        error: null
      });

      // Act
      const result = await service.update(id, updateDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('data_types');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        name: updateDto.name,
        description: updateDto.description,
        version: 2,
        updated_by: userId
      }));
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', id);
      
      expect(mockAuditService.log).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        id: updatedDataType.id,
        companyId: updatedDataType.company_id,
        name: updatedDataType.name,
        description: updatedDataType.description,
        version: updatedDataType.version
      }));
    });
  });

  describe('remove', () => {
    it('should delete a data type', async () => {
      // Arrange
      const id = 'test-data-type-id';
      const userId = 'test-user-id';
      
      const dataType = {
        id,
        companyId: 'company-1',
        name: 'Email',
        code: 'EMAIL',
        type: DataType.EMAIL,
        status: DataTypeStatus.ACTIVE
      };
      
      // Configurar mock para findOne
      jest.spyOn(service, 'findOne').mockResolvedValue(dataType as any);
      
      // Configurar mocks de Supabase
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValue({
        error: null
      });

      // Act
      await service.remove(id, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('data_types');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', id);
      
      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        resourceId: id,
        userId
      }));
    });

    it('should throw NotFoundException when data type to be removed is not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      const userId = 'test-user-id';
      
      // Configurar mock para findOne para lanzar error
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException(`Data type with ID ${id} not found`));
      
      // Act & Assert
      await expect(service.remove(id, userId)).rejects.toThrow(NotFoundException);
      expect(mockSupabaseClient.delete).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should throw an error when deletion fails', async () => {
      // Arrange
      const id = 'test-data-type-id';
      const userId = 'test-user-id';
      
      // Configurar mock para findOne
      jest.spyOn(service, 'findOne').mockResolvedValue({ 
        id,
        companyId: 'company-1',
        name: 'Email',
        code: 'EMAIL',
        type: DataType.EMAIL,
        status: DataTypeStatus.ACTIVE
      } as any);
      
      // Configurar mocks de Supabase para error en delete
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValue({
        error: { message: 'Deletion failed' }
      });

      // Act & Assert
      await expect(service.remove(id, userId)).rejects.toEqual(
        expect.objectContaining({ message: 'Deletion failed' })
      );
      
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });
});
