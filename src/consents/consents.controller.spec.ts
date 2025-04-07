import { Test, TestingModule } from '@nestjs/testing';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import {
  ConsentDto,
  ConsentRequestDto,
  CreateConsentRequestDto,
  RespondConsentRequestDto,
  UpdateConsentStatusDto,
  ConsentStatus,
  ConsentWithDetailsDto,
  ConsentStatusResponseDto,
  ConsentRequestResponseDto,
  ConsentRequestAnswerResponseDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';
import { PolicyDto } from '../policies/dto';

// Mock del servicio de consentimientos
const mockConsentsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  createRequest: jest.fn(),
  respondToRequest: jest.fn(),
  updateStatus: jest.fn(),
  findRequest: jest.fn(),
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
          legalPolicyId: 'policy-1',
          dataSubjectId: 'user-1',
          consentRequestId: 'request-1',
          status: ConsentStatus.GRANTED,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          expiresAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockConsentsService.findAll.mockResolvedValue(mockConsents);

      // Mock de la solicitud con contexto de compañía
      const mockRequest = {
        companyContext: {
          companyId: 'company-1',
          role: 'admin'
        }
      } as unknown as RequestWithCompanyContext;

      // Act
      const result = await controller.findAll(mockRequest);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith('company-1', undefined, undefined);
      expect(result).toEqual(mockConsents);
    });

    it('should filter consents by legal policy id', async () => {
      // Arrange
      const legalPolicyId = 'policy-1';
      const mockConsents: ConsentDto[] = [
        {
          id: 'consent-1',
          legalPolicyId: legalPolicyId,
          dataSubjectId: 'user-1',
          consentRequestId: 'request-1',
          status: ConsentStatus.GRANTED,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          expiresAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockConsentsService.findAll.mockResolvedValue(mockConsents);

      // Mock de la solicitud con contexto de compañía
      const mockRequest = {
        companyContext: {
          companyId: 'company-1',
          role: 'admin'
        }
      } as unknown as RequestWithCompanyContext;

      // Act
      const result = await controller.findAll(mockRequest, legalPolicyId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(legalPolicyId, undefined, undefined);
      expect(result).toEqual(mockConsents);
    });

    it('should filter consents by data subject id', async () => {
      // Arrange
      const dataSubjectId = 'user-1';
      const mockConsents: ConsentDto[] = [
        {
          id: 'consent-1',
          legalPolicyId: 'policy-1',
          dataSubjectId: dataSubjectId,
          consentRequestId: 'request-1',
          status: ConsentStatus.GRANTED,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          expiresAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockConsentsService.findAll.mockResolvedValue(mockConsents);

      // Mock de la solicitud con contexto de compañía
      const mockRequest = {
        companyContext: {
          companyId: 'company-1',
          role: 'admin'
        }
      } as unknown as RequestWithCompanyContext;

      // Act
      const result = await controller.findAll(mockRequest, undefined, dataSubjectId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith('company-1', dataSubjectId, undefined);
      expect(result).toEqual(mockConsents);
    });
  });

  describe('findOne', () => {
    it('should return a consent by id', async () => {
      // Arrange
      const consentId = 'consent-1';
      const mockConsent: ConsentWithDetailsDto = {
        id: consentId,
        legalPolicyId: 'policy-1',
        dataSubjectId: 'user-1',
        consentRequestId: 'request-1',
        status: ConsentStatus.GRANTED,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z',
        legalPolicy: {
          id: 'policy-1',
          title: 'Privacy Policy',
          content: 'Content of privacy policy',
          companyId: 'company-1',
          validFrom: '2023-01-01T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        },
        dataSubject: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      };

      mockConsentsService.findOne.mockResolvedValue(mockConsent);

      // Act
      const result = await controller.findOne(consentId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(consentId);
      expect(result).toEqual(mockConsent);
    });
  });

  describe('createRequest', () => {
    it('should create a new consent request', async () => {
      // Arrange
      const userId = 'user-1';
      const createConsentRequestDto: CreateConsentRequestDto = {
        legalPolicyId: 'policy-1',
        dataSubjectEmail: 'user2@example.com',
        dataSubjectName: 'User Two',
        dataTypeIds: ['datatype-1', 'datatype-2'],
        expiresAt: '2024-01-01T00:00:00Z',
      };

      const mockResult: ConsentRequestDto = {
        id: 'request-1',
        legalPolicyId: createConsentRequestDto.legalPolicyId,
        dataSubjectId: 'user-2',
        companyId: 'company-1',
        status: 'PENDING',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        expiresAt: createConsentRequestDto.expiresAt,
      };

      const expectedResponse: ConsentRequestResponseDto = {
        message: 'Solicitud de consentimiento creada correctamente',
        requestId: mockResult.id,
        responseUrl: `https://app.consentia.io/consents/respond/${mockResult.id}`,
        expiresAt: mockResult.expiresAt
      };

      mockConsentsService.createRequest.mockResolvedValue(mockResult);

      // Act
      const result = await controller.createRequest(createConsentRequestDto, userId);

      // Assert
      expect(service.createRequest).toHaveBeenCalledWith(createConsentRequestDto, userId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('respondToRequest', () => {
    it('should respond to a consent request', async () => {
      // Arrange
      const requestId = 'request-1';
      const respondDto: RespondConsentRequestDto = {
        accepted: true,
        acceptedDataTypeIds: ['datatype-1', 'datatype-2'],
        metadata: {
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0'
        }
      };

      const mockConsent: ConsentDto = {
        id: 'consent-1',
        legalPolicyId: 'policy-1',
        dataSubjectId: 'user-2',
        consentRequestId: requestId,
        status: ConsentStatus.GRANTED,
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z',
      };

      const expectedResponse: ConsentRequestAnswerResponseDto = {
        message: 'Respuesta a solicitud de consentimiento registrada correctamente',
        consentId: mockConsent.id,
        decision: mockConsent.status,
        respondedAt: mockConsent.createdAt
      };

      mockConsentsService.respondToRequest.mockResolvedValue(mockConsent);

      // Mock de la solicitud HTTP
      const mockRequest = {
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'Mozilla/5.0'
        },
      } as unknown as RequestWithCompanyContext;

      // Act
      const result = await controller.respondToRequest(requestId, respondDto, mockRequest);

      // Assert
      expect(service.respondToRequest).toHaveBeenCalledWith(
        requestId,
        respondDto,
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateStatus', () => {
    it('should update consent status', async () => {
      // Arrange
      const consentId = 'consent-1';
      const userId = 'user-1';
      const updateDto: UpdateConsentStatusDto = {
        status: ConsentStatus.REVOKED,
      };

      const oldConsent: ConsentWithDetailsDto = {
        id: consentId,
        legalPolicyId: 'policy-1',
        dataSubjectId: userId,
        consentRequestId: 'request-1',
        status: ConsentStatus.GRANTED,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z',
        legalPolicy: {
          id: 'policy-1',
          title: 'Privacy Policy',
          content: 'Content of privacy policy',
          companyId: 'company-1',
          validFrom: '2023-01-01T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        },
        dataSubject: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      };

      const updatedConsent: ConsentDto = {
        id: consentId,
        legalPolicyId: 'policy-1',
        dataSubjectId: userId,
        consentRequestId: 'request-1',
        status: ConsentStatus.REVOKED,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z',
      };

      const expectedResponse: ConsentStatusResponseDto = {
        message: 'Estado del consentimiento actualizado correctamente',
        id: updatedConsent.id,
        previousStatus: oldConsent.status,
        currentStatus: updatedConsent.status,
        updatedAt: updatedConsent.updatedAt
      };

      mockConsentsService.findOne.mockResolvedValue(oldConsent);
      mockConsentsService.updateStatus.mockResolvedValue(updatedConsent);

      // Act
      const result = await controller.updateStatus(consentId, updateDto, userId);

      // Assert
      expect(service.updateStatus).toHaveBeenCalledWith(consentId, updateDto, userId);
      expect(result).toEqual(expectedResponse);
    });
  });
});
