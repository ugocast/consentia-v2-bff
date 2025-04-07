import { Test, TestingModule } from '@nestjs/testing';
import { DataSubjectsService } from './data-subjects.service';
import { AuditService } from '../common/audit/audit.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { 
  PortalAccessRequestDto,
  PortalVerificationDto,
  DataAccessRequestDto,
  DataRequestStatus 
} from './dto';

jest.mock('./data-subjects.service');

describe('DataSubjectsService', () => {
  let service: DataSubjectsService;
  
  // Mock del servicio de auditoría
  const mockAuditService = {
    log: jest.fn().mockImplementation(() => Promise.resolve()),
  };

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSubjectsService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<DataSubjectsService>(DataSubjectsService);
    
    // Reestablecemos las implementaciones de los mocks después de cada prueba
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Portal Access', () => {
    describe('requestPortalAccess', () => {
      it('should successfully request portal access', async () => {
        // Preparar datos de prueba
        const requestDto: PortalAccessRequestDto = {
          email: 'john.doe@example.com',
        };
        
        const expectedResponse = {
          message: 'Se ha enviado un enlace de acceso al correo electrónico proporcionado'
        };
        
        // Configurar mock
        (service.requestPortalAccess as jest.Mock).mockResolvedValue(expectedResponse);
        
        // Act
        const result = await service.requestPortalAccess(requestDto);
        
        // Assert
        expect(result).toEqual(expectedResponse);
        expect(service.requestPortalAccess).toHaveBeenCalledWith(requestDto);
      });

      it('should throw NotFoundException when data subject with email not found', async () => {
        // Preparar datos de prueba
        const requestDto: PortalAccessRequestDto = {
          email: 'nonexistent@example.com',
        };
        
        // Configurar mock para simular usuario no encontrado
        const error = new NotFoundException('Titular de datos no encontrado');
        (service.requestPortalAccess as jest.Mock).mockRejectedValue(error);
        
        // Act & Assert
        await expect(service.requestPortalAccess(requestDto)).rejects.toThrow(NotFoundException);
      });
    });

    describe('verifyPortalAccess', () => {
      it('should verify portal access successfully with valid token', async () => {
        // Preparar datos de prueba
        const verificationDto: PortalVerificationDto = {
          token: 'valid-token',
        };
        
        const expectedResponse = {
          dataSubjectId: 'data-subject-1'
        };
        
        // Configurar mock
        (service.verifyPortalAccess as jest.Mock).mockResolvedValue(expectedResponse);
        
        // Act
        const result = await service.verifyPortalAccess(verificationDto);
        
        // Assert
        expect(result).toEqual(expectedResponse);
        expect(service.verifyPortalAccess).toHaveBeenCalledWith(verificationDto);
      });

      it('should throw UnauthorizedException when token is invalid', async () => {
        // Preparar datos de prueba
        const verificationDto: PortalVerificationDto = {
          token: 'invalid-token',
        };
        
        // Configurar mock para simular token inválido
        const error = new UnauthorizedException('Token de acceso inválido');
        (service.verifyPortalAccess as jest.Mock).mockRejectedValue(error);
        
        // Act & Assert
        await expect(service.verifyPortalAccess(verificationDto)).rejects.toThrow(UnauthorizedException);
      });
    });
  });

  describe('ARCO Rights', () => {
    describe('requestDataAccess', () => {
      it('should successfully generate a data access request', async () => {
        // Preparar datos de prueba
        const dataSubjectId = 'data-subject-1';
        const requestDto: DataAccessRequestDto = {
          reason: 'Access for verification'
        };
        
        // Datos de prueba para mock
        const mockResponse = {
          requestId: 'request-1',
          requestDate: new Date().toISOString(),
          personalData: {
            'Personal Information': [
              {
                id: 'dt-1',
                name: 'Email',
                code: 'email',
                description: 'Email address',
                value: 'john.doe@example.com'
              },
              {
                id: 'dt-2',
                name: 'Full Name',
                code: 'full_name',
                description: 'Full name of the person',
                value: 'John Doe'
              },
              {
                id: 'dt-3',
                name: 'Age',
                code: 'age',
                description: 'Age in years',
                value: 30
              }
            ]
          }
        };
        
        // Configurar mock
        (service.requestDataAccess as jest.Mock).mockResolvedValue(mockResponse);
        
        // Act
        const result = await service.requestDataAccess(dataSubjectId, requestDto);
        
        // Assert
        expect(service.requestDataAccess).toHaveBeenCalledWith(dataSubjectId, requestDto);
        expect(result).toEqual(mockResponse);
        expect(result).toHaveProperty('personalData');
        expect(result).toHaveProperty('requestId', 'request-1');
        expect(result).toHaveProperty('requestDate');
        
        // Verificar que los datos personales tengan los valores correctos
        expect(result.personalData['Personal Information']).toBeDefined();
        expect(result.personalData['Personal Information']).toHaveLength(3);
        
        // Verificar que los valores sean correctos
        const emailData = result.personalData['Personal Information'].find(dt => dt.code === 'email');
        expect(emailData.value).toBe('john.doe@example.com');
        
        const nameData = result.personalData['Personal Information'].find(dt => dt.code === 'full_name');
        expect(nameData.value).toBe('John Doe');
        
        const ageData = result.personalData['Personal Information'].find(dt => dt.code === 'age');
        expect(ageData.value).toBe(30);
      });

      it('should throw NotFoundException when data subject does not exist', async () => {
        // Preparar datos de prueba
        const dataSubjectId = 'nonexistent-id';
        const requestDto: DataAccessRequestDto = {
          reason: 'Access for verification'
        };
        
        // Configurar mock para simular titular no encontrado
        const error = new NotFoundException('Titular de datos no encontrado');
        (service.requestDataAccess as jest.Mock).mockRejectedValue(error);
        
        // Act & Assert
        await expect(service.requestDataAccess(dataSubjectId, requestDto)).rejects.toThrow(NotFoundException);
      });
    });
  });
}); 