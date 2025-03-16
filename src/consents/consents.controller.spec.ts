import { Test, TestingModule } from '@nestjs/testing';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import { 
  ConsentDto, 
  ConsentRequestDto, 
  CreateConsentRequestDto, 
  RespondConsentRequestDto,
  UpdateConsentStatusDto,
  ConsentStatus
} from './dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { Request } from 'express';

// Mock del servicio de consentimientos
const mockConsentsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  createConsentRequest: jest.fn(),
  respondToConsentRequest: jest.fn(),
  updateConsentStatus: jest.fn(),
};

// Mock del guard de autenticación
const mockJwtAuthGuard = { canActivate: jest.fn() };

describe('ConsentsController', () => {
  let controller: ConsentsController;
  let service: ConsentsService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsentsController],
      providers: [
        {
          provide: ConsentsService,
          useValue: mockConsentsService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .compile();

    controller = module.get<ConsentsController>(ConsentsController);
    service = module.get<ConsentsService>(ConsentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all consents', async () => {
      // Arrange
      const mockConsents: ConsentDto[] = [
        {
          id: 'consent-1',
          legal_policy_id: 'policy-1',
          data_subject_id: 'user-1',
          status: 'ACTIVE',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      mockConsentsService.findAll.mockResolvedValue(mockConsents);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockConsents);
    });

    it('should filter consents by legal policy id', async () => {
      // Arrange
      const legalPolicyId = 'policy-1';
      const mockConsents: ConsentDto[] = [
        {
          id: 'consent-1',
          legal_policy_id: legalPolicyId,
          data_subject_id: 'user-1',
          status: 'ACTIVE',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      mockConsentsService.findAll.mockResolvedValue(mockConsents);

      // Act
      const result = await controller.findAll(legalPolicyId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(legalPolicyId, undefined);
      expect(result).toEqual(mockConsents);
    });

    it('should filter consents by data subject id', async () => {
      // Arrange
      const dataSubjectId = 'user-1';
      const mockConsents: ConsentDto[] = [
        {
          id: 'consent-1',
          legal_policy_id: 'policy-1',
          data_subject_id: dataSubjectId,
          status: 'ACTIVE',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      mockConsentsService.findAll.mockResolvedValue(mockConsents);

      // Act
      const result = await controller.findAll(undefined, dataSubjectId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(undefined, dataSubjectId);
      expect(result).toEqual(mockConsents);
    });
  });

  describe('findOne', () => {
    it('should return a consent by id', async () => {
      // Arrange
      const consentId = 'consent-1';
      const mockConsent: ConsentDto = {
        id: consentId,
        legal_policy_id: 'policy-1',
        data_subject_id: 'user-1',
        status: 'ACTIVE',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };
      
      mockConsentsService.findOne.mockResolvedValue(mockConsent);

      // Act
      const result = await controller.findOne(consentId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(consentId);
      expect(result).toEqual(mockConsent);
    });
  });

  describe('createConsentRequest', () => {
    it('should create a new consent request', async () => {
      // Arrange
      const userId = 'user-1';
      const createConsentRequestDto: CreateConsentRequestDto = {
        legalPolicyId: 'policy-1',
        dataSubjectId: 'user-2',
        expiresAt: '2024-01-01T00:00:00Z',
      };
      
      const mockRequest: ConsentRequestDto = {
        id: 'request-1',
        legal_policy_id: createConsentRequestDto.legalPolicyId,
        data_subject_id: createConsentRequestDto.dataSubjectId,
        requested_by: userId,
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: createConsentRequestDto.expiresAt,
      };
      
      mockConsentsService.createConsentRequest.mockResolvedValue(mockRequest);
      
      // Mock de la solicitud con el usuario autenticado
      const mockRequest1 = {
        user: { id: userId },
      } as unknown as Request;

      // Act
      const result = await controller.createConsentRequest(createConsentRequestDto, mockRequest1);

      // Assert
      expect(service.createConsentRequest).toHaveBeenCalledWith(createConsentRequestDto, userId);
      expect(result).toEqual(mockRequest);
    });
  });

  describe('respondToConsentRequest', () => {
    it('should respond to a consent request', async () => {
      // Arrange
      const requestId = 'request-1';
      const userId = 'user-2';
      const respondDto: RespondConsentRequestDto = {
        response: 'ACCEPT',
      };
      
      const mockResponse = {
        request: {
          id: requestId,
          legal_policy_id: 'policy-1',
          data_subject_id: userId,
          requested_by: 'user-1',
          status: 'ACCEPTED',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
        consent: {
          id: 'consent-1',
          legal_policy_id: 'policy-1',
          data_subject_id: userId,
          status: 'ACTIVE',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
      };
      
      mockConsentsService.respondToConsentRequest.mockResolvedValue(mockResponse);
      
      // Mock de la solicitud con el usuario autenticado
      const mockRequest1 = {
        user: { id: userId },
      } as unknown as Request;

      // Act
      const result = await controller.respondToConsentRequest(requestId, respondDto, mockRequest1);

      // Assert
      expect(service.respondToConsentRequest).toHaveBeenCalledWith(requestId, respondDto, userId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateConsentStatus', () => {
    it('should update consent status', async () => {
      // Arrange
      const consentId = 'consent-1';
      const userId = 'user-1';
      const updateDto: UpdateConsentStatusDto = {
        status: 'REVOKED',
      };
      
      const mockUpdatedConsent: ConsentDto = {
        id: consentId,
        legal_policy_id: 'policy-1',
        data_subject_id: userId,
        status: 'REVOKED',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };
      
      mockConsentsService.updateConsentStatus.mockResolvedValue(mockUpdatedConsent);
      
      // Mock de la solicitud con el usuario autenticado
      const mockRequest1 = {
        user: { id: userId },
      } as unknown as Request;

      // Act
      const result = await controller.updateConsentStatus(consentId, updateDto, mockRequest1);

      // Assert
      expect(service.updateConsentStatus).toHaveBeenCalledWith(consentId, updateDto, userId);
      expect(result).toEqual(mockUpdatedConsent);
    });
  });
});
