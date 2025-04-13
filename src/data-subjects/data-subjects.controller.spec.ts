import { Test, TestingModule } from '@nestjs/testing';
import { DataSubjectsController } from './data-subjects.controller';
import { DataSubjectsService } from './data-subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  CreateDataSubjectDto, 
  DataSubjectDto, 
  DataSubjectStatus, 
  UpdateDataSubjectDto,
  PortalAccessRequestDto,
  ConsentHistoryDto,
  ConsentPreferencesDto,
  DataDeletionRequestDto,
  DataAccessRequestDto,
  DataAccessResponseDto,
  DataRectificationRequestDto
} from './dto';
import { Request } from 'express';

// Mock del servicio de titulares de datos
const mockDataSubjectsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  requestPortalAccess: jest.fn(),
  verifyPortalAccess: jest.fn(),
  getConsentHistory: jest.fn(),
  getConsentPreferences: jest.fn(),
  requestDataDeletion: jest.fn(),
  requestDataAccess: jest.fn(),
  requestDataRectification: jest.fn(),
};

// Mock del guard de autenticación
const mockJwtGuard = {
  canActivate: jest.fn().mockImplementation(() => true),
};

describe('DataSubjectsController', () => {
  let controller: DataSubjectsController;
  let service: DataSubjectsService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataSubjectsController],
      providers: [
        {
          provide: DataSubjectsService,
          useValue: mockDataSubjectsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<DataSubjectsController>(DataSubjectsController);
    service = module.get<DataSubjectsService>(DataSubjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a data subject', async () => {
      // Arrange
      const createDto: CreateDataSubjectDto = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        companyId: 'company-1',
      };

      const mockRequest = {
        user: { id: 'user-1' }
      } as Request;

      const mockResult: DataSubjectDto = {
        id: 'subject-1',
        fullName: createDto.fullName,
        email: createDto.email,
        companyId: createDto.companyId,
        status: DataSubjectStatus.ACTIVE,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDataSubjectsService.create.mockResolvedValue(mockResult);

      // Act
      const result = await controller.create(createDto, mockRequest);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto, 'user-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all data subjects', async () => {
      // Arrange
      const mockResults: DataSubjectDto[] = [
        {
          id: 'subject-1',
          fullName: 'John Doe',
          email: 'john@example.com',
          companyId: 'company-1',
          status: DataSubjectStatus.ACTIVE,
          verified: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'subject-2',
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          companyId: 'company-1',
          status: DataSubjectStatus.ACTIVE,
          verified: false,
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
        }
      ];

      mockDataSubjectsService.findAll.mockResolvedValue(mockResults);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    it('should filter by company ID', async () => {
      // Arrange
      const companyId = 'company-1';
      const mockResults: DataSubjectDto[] = [
        {
          id: 'subject-1',
          fullName: 'John Doe',
          email: 'john@example.com',
          companyId,
          status: DataSubjectStatus.ACTIVE,
          verified: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }
      ];

      mockDataSubjectsService.findAll.mockResolvedValue(mockResults);

      // Act
      const result = await controller.findAll(companyId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(companyId, undefined);
      expect(result).toEqual(mockResults);
    });

    it('should filter by status', async () => {
      // Arrange
      const status = DataSubjectStatus.ACTIVE;
      const mockResults: DataSubjectDto[] = [
        {
          id: 'subject-1',
          fullName: 'John Doe',
          email: 'john@example.com',
          companyId: 'company-1',
          status,
          verified: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }
      ];

      mockDataSubjectsService.findAll.mockResolvedValue(mockResults);

      // Act
      const result = await controller.findAll(undefined, status);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(undefined, status);
      expect(result).toEqual(mockResults);
    });
  });

  describe('findOne', () => {
    it('should return a data subject by ID', async () => {
      // Arrange
      const id = 'subject-1';
      const mockResult: DataSubjectDto = {
        id,
        fullName: 'John Doe',
        email: 'john@example.com',
        companyId: 'company-1',
        status: DataSubjectStatus.ACTIVE,
        verified: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockDataSubjectsService.findOne.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findByEmail', () => {
    it('should return a data subject by email', async () => {
      // Arrange
      const email = 'john@example.com';
      const companyId = 'company-1';
      const mockResult: DataSubjectDto = {
        id: 'subject-1',
        fullName: 'John Doe',
        email,
        companyId,
        status: DataSubjectStatus.ACTIVE,
        verified: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockDataSubjectsService.findByEmail.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findByEmail(email, companyId);

      // Assert
      expect(service.findByEmail).toHaveBeenCalledWith(email, companyId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update a data subject', async () => {
      // Arrange
      const id = 'subject-1';
      const updateDto: UpdateDataSubjectDto = {
        fullName: 'John Updated',
        phone: '+56987654321',
      };

      const mockRequest = {
        user: { id: 'user-1' }
      } as Request;

      const mockResult: DataSubjectDto = {
        id,
        fullName: updateDto.fullName,
        email: 'john@example.com',
        phone: updateDto.phone,
        companyId: 'company-1',
        status: DataSubjectStatus.ACTIVE,
        verified: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      };

      mockDataSubjectsService.update.mockResolvedValue(mockResult);

      // Act
      const result = await controller.update(id, updateDto, mockRequest);

      // Assert
      expect(service.update).toHaveBeenCalledWith(id, updateDto, 'user-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should delete a data subject', async () => {
      // Arrange
      const id = 'subject-1';
      const mockRequest = {
        user: { id: 'user-1' }
      } as Request;

      mockDataSubjectsService.remove.mockResolvedValue({ success: true });

      // Act
      const result = await controller.remove(id, mockRequest);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(id, 'user-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('requestPortalAccess', () => {
    it('should request portal access', async () => {
      // Arrange
      const requestDto: PortalAccessRequestDto = {
        email: 'john@example.com',
        companyId: 'company-1',
      };

      mockDataSubjectsService.requestPortalAccess.mockResolvedValue({
        message: 'Access link sent successfully'
      });

      // Act
      const result = await controller.requestPortalAccess(requestDto);

      // Assert
      expect(service.requestPortalAccess).toHaveBeenCalledWith(requestDto);
      expect(result).toEqual({
        message: 'Access link sent successfully'
      });
    });
  });

  describe('getConsentHistory', () => {
    it('should return consent history for a data subject', async () => {
      // Arrange
      const id = 'subject-1';
      
      const mockResult: ConsentHistoryDto[] = [
        {
          id: 'consent-1',
          policyName: 'Privacy Policy',
          status: 'ACCEPTED',
          consentedAt: '2023-01-01T00:00:00Z',
          expiresAt: '2024-01-01T00:00:00Z',
        }
      ];

      mockDataSubjectsService.getConsentHistory.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getConsentHistory(id);

      // Assert
      expect(service.getConsentHistory).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getConsentPreferences', () => {
    it('should return consent preferences for a data subject', async () => {
      // Arrange
      const id = 'subject-1';
      
      const mockResult: ConsentPreferencesDto = {
        id: 'subject-1',
        preferences: {
          marketing: {
            email: true,
            sms: false,
          },
          analytics: {
            tracking: true,
          }
        },
        lastUpdated: '2023-01-01T00:00:00Z',
      };

      mockDataSubjectsService.getConsentPreferences.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getConsentPreferences(id);

      // Assert
      expect(service.getConsentPreferences).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockResult);
    });
  });
});
