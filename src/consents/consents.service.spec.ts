import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import { AuditService } from '../common/audit/audit.service';
import { mockSupabaseClient, mockCreateSupabaseClient } from '../common/mocks/supabase.mock';
import { 
  ConsentDto, 
  ConsentRequestDto, 
  CreateConsentRequestDto, 
  RespondConsentRequestDto,
  UpdateConsentStatusDto,
  ConsentStatus
} from './dto';

// Mock del servicio de auditoría
const mockAuditService = {
  log: jest.fn().mockImplementation(() => Promise.resolve()),
};

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('ConsentsService', () => {
  let service: ConsentsService;
  let auditService: AuditService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar el mock para devolver el cliente de Supabase
    mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentsService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ConsentsService>(ConsentsService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all consents', async () => {
      // Arrange
      const mockConsents: ConsentDto[] = [
        {
          id: 'consent-1',
          legal_policy_id: 'policy-1',
          data_subject_id: 'user-1',
          status: ConsentStatus.ACTIVE,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para devolver los datos
      const mockResponse = {
        data: mockConsents,
        error: null,
      };
      
      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockResponse);
      mockSupabaseClient.then = mockThen;

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
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
          status: ConsentStatus.ACTIVE,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          expires_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para devolver los datos
      const mockResponse = {
        data: mockConsents,
        error: null,
      };
      
      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockResponse);
      mockSupabaseClient.then = mockThen;

      // Act
      const result = await service.findAll(undefined, dataSubjectId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('data_subject_id', dataSubjectId);
      expect(result).toEqual(mockConsents);
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para devolver un error
      const mockResponse = {
        data: null,
        error: { message: 'Database error' },
      };
      
      // Usar una función para simular la resolución de la promesa
      const mockThen = jest.fn().mockResolvedValue(mockResponse);
      mockSupabaseClient.then = mockThen;

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Error al obtener consentimientos: Database error');
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
        status: ConsentStatus.ACTIVE,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: mockConsent,
        error: null,
      });

      // Act
      const result = await service.findOne(consentId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', consentId);
      expect(result).toEqual(mockConsent);
    });

    it('should throw NotFoundException when consent is not found', async () => {
      // Arrange
      const consentId = 'nonexistent-consent-id';

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Consent not found' },
      });

      // Act & Assert
      await expect(service.findOne(consentId)).rejects.toThrow(NotFoundException);
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

      const mockCreatedRequest: ConsentRequestDto = {
        id: 'request-1',
        legal_policy_id: createConsentRequestDto.legalPolicyId,
        data_subject_id: createConsentRequestDto.dataSubjectId,
        requested_by: userId,
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: createConsentRequestDto.expiresAt,
      };

      // Mock para verificar que la política existe
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: { id: 'policy-1' },
          error: null,
        });
      
      // Mock para insertar la solicitud
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método select después de insert
      const mockSelectAfterInsert = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockCreatedRequest,
          error: null,
        }),
      });
      mockSupabaseClient.select = mockSelectAfterInsert;

      // Act
      const result = await service.createConsentRequest(createConsentRequestDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', createConsentRequestDto.legalPolicyId);
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('valid_to', null);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent_request');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        legal_policy_id: createConsentRequestDto.legalPolicyId,
        data_subject_id: createConsentRequestDto.dataSubjectId,
        requested_by: userId,
        status: 'PENDING',
        expires_at: createConsentRequestDto.expiresAt,
      }));
      
      expect(result).toEqual(mockCreatedRequest);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when policy does not exist', async () => {
      // Arrange
      const userId = 'user-1';
      const createConsentRequestDto: CreateConsentRequestDto = {
        legalPolicyId: 'nonexistent-policy-id',
        dataSubjectId: 'user-2',
        expiresAt: '2024-01-01T00:00:00Z',
      };

      // Mock para verificar que la política existe
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Policy not found' },
        });

      // Act & Assert
      await expect(service.createConsentRequest(createConsentRequestDto, userId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('respondToConsentRequest', () => {
    it('should accept a consent request', async () => {
      // Arrange
      const requestId = 'request-1';
      const userId = 'user-2';
      const respondDto: RespondConsentRequestDto = {
        response: 'ACCEPT',
      };

      const mockRequest: ConsentRequestDto = {
        id: requestId,
        legal_policy_id: 'policy-1',
        data_subject_id: userId,
        requested_by: 'user-1',
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      const mockUpdatedRequest: ConsentRequestDto = {
        ...mockRequest,
        status: 'ACCEPTED',
        updated_at: '2023-01-02T00:00:00Z',
      };

      const mockCreatedConsent: ConsentDto = {
        id: 'consent-1',
        legal_policy_id: mockRequest.legal_policy_id,
        data_subject_id: mockRequest.data_subject_id,
        status: ConsentStatus.ACTIVE,
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        expires_at: mockRequest.expires_at,
      };

      // Mock para obtener la solicitud
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: mockRequest,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockCreatedConsent,
          error: null,
        });
      
      // Mock para actualizar la solicitud
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método then después de update
      const mockThenAfterUpdate = jest.fn().mockResolvedValue({
        data: { id: requestId },
        error: null,
      });
      mockSupabaseClient.then = mockThenAfterUpdate;
      
      // Mock para insertar el consentimiento
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);

      // Act
      const result = await service.respondToConsentRequest(requestId, respondDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent_request');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', requestId);
      
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ACCEPTED',
        updated_at: expect.any(String),
      }));
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(expect.objectContaining({
        legal_policy_id: mockRequest.legal_policy_id,
        data_subject_id: mockRequest.data_subject_id,
        status: ConsentStatus.ACTIVE,
        expires_at: mockRequest.expires_at,
      }));
      
      expect(result).toEqual({
        request: mockUpdatedRequest,
        consent: mockCreatedConsent,
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should reject a consent request', async () => {
      // Arrange
      const requestId = 'request-1';
      const userId = 'user-2';
      const respondDto: RespondConsentRequestDto = {
        response: 'REJECT',
      };

      const mockRequest: ConsentRequestDto = {
        id: requestId,
        legal_policy_id: 'policy-1',
        data_subject_id: userId,
        requested_by: 'user-1',
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      const mockUpdatedRequest: ConsentRequestDto = {
        ...mockRequest,
        status: 'REJECTED',
        updated_at: '2023-01-02T00:00:00Z',
      };

      // Mock para obtener la solicitud
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: mockRequest,
          error: null,
        });
      
      // Mock para actualizar la solicitud
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método then después de update
      const mockThenAfterUpdate = jest.fn().mockResolvedValue({
        data: { id: requestId },
        error: null,
      });
      mockSupabaseClient.then = mockThenAfterUpdate;

      // Act
      const result = await service.respondToConsentRequest(requestId, respondDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent_request');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', requestId);
      
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'REJECTED',
        updated_at: expect.any(String),
      }));
      
      expect(result).toEqual({
        request: mockUpdatedRequest,
        consent: null,
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      const requestId = 'nonexistent-request-id';
      const userId = 'user-2';
      const respondDto: RespondConsentRequestDto = {
        response: 'ACCEPT',
      };

      // Mock para obtener la solicitud
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Request not found' },
        });

      // Act & Assert
      await expect(service.respondToConsentRequest(requestId, respondDto, userId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not the data subject', async () => {
      // Arrange
      const requestId = 'request-1';
      const userId = 'user-3'; // Different from data_subject_id
      const respondDto: RespondConsentRequestDto = {
        response: 'ACCEPT',
      };

      const mockRequest: ConsentRequestDto = {
        id: requestId,
        legal_policy_id: 'policy-1',
        data_subject_id: 'user-2', // Different from userId
        requested_by: 'user-1',
        status: 'PENDING',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      // Mock para obtener la solicitud
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: mockRequest,
          error: null,
        });

      // Act & Assert
      await expect(service.respondToConsentRequest(requestId, respondDto, userId))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when request is not pending', async () => {
      // Arrange
      const requestId = 'request-1';
      const userId = 'user-2';
      const respondDto: RespondConsentRequestDto = {
        response: 'ACCEPT',
      };

      const mockRequest: ConsentRequestDto = {
        id: requestId,
        legal_policy_id: 'policy-1',
        data_subject_id: userId,
        requested_by: 'user-1',
        status: 'ACCEPTED', // Already accepted
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      // Mock para obtener la solicitud
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: mockRequest,
          error: null,
        });

      // Act & Assert
      await expect(service.respondToConsentRequest(requestId, respondDto, userId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateConsentStatus', () => {
    it('should update consent status to revoked', async () => {
      // Arrange
      const consentId = 'consent-1';
      const userId = 'user-1';
      const updateDto: UpdateConsentStatusDto = {
        status: ConsentStatus.REVOKED,
      };

      const mockConsent: ConsentDto = {
        id: consentId,
        legal_policy_id: 'policy-1',
        data_subject_id: userId,
        status: ConsentStatus.ACTIVE,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      const mockUpdatedConsent: ConsentDto = {
        ...mockConsent,
        status: ConsentStatus.REVOKED,
        updated_at: '2023-01-02T00:00:00Z',
      };

      // Mock para obtener el consentimiento
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: mockConsent,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockUpdatedConsent,
          error: null,
        });
      
      // Mock para actualizar el consentimiento
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);

      // Act
      const result = await service.updateConsentStatus(consentId, updateDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('consent');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', consentId);
      
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(expect.objectContaining({
        status: ConsentStatus.REVOKED,
        updated_at: expect.any(String),
      }));
      
      expect(result).toEqual(mockUpdatedConsent);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when consent does not exist', async () => {
      // Arrange
      const consentId = 'nonexistent-consent-id';
      const userId = 'user-1';
      const updateDto: UpdateConsentStatusDto = {
        status: ConsentStatus.REVOKED,
      };

      // Mock para obtener el consentimiento
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Consent not found' },
        });

      // Act & Assert
      await expect(service.updateConsentStatus(consentId, updateDto, userId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not the data subject', async () => {
      // Arrange
      const consentId = 'consent-1';
      const userId = 'user-2'; // Different from data_subject_id
      const updateDto: UpdateConsentStatusDto = {
        status: ConsentStatus.REVOKED,
      };

      const mockConsent: ConsentDto = {
        id: consentId,
        legal_policy_id: 'policy-1',
        data_subject_id: 'user-1', // Different from userId
        status: ConsentStatus.ACTIVE,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:00:00Z',
      };

      // Mock para obtener el consentimiento
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      
      // Configurar el mock para el método single
      mockSupabaseClient.single = jest.fn()
        .mockResolvedValueOnce({
          data: mockConsent,
          error: null,
        });

      // Act & Assert
      await expect(service.updateConsentStatus(consentId, updateDto, userId))
        .rejects.toThrow(BadRequestException);
    });
  });
});
