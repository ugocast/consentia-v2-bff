import { Test, TestingModule } from '@nestjs/testing';
import { 
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { 
  CreateInvitationDto, 
  AcceptInvitationDto, 
  InvitationDto 
} from './dto';
import { InvitationStatus } from './enums/invitation-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { CompanyUsersService } from '../company-users/company-users.service';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { EmailService } from '../common/services/email/email.service';
import { ConfigService } from '@nestjs/config';

// Mock de createSupabaseClient
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(() => mockSupabaseClient),
}));

// Mock del cliente de Supabase
const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  neq: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  in: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

// Mock del servicio de autenticación
const mockAuthService = {
  register: jest.fn(),
};

// Mock del servicio de usuarios de compañía
const mockCompanyUsersService = {
  create: jest.fn(),
  validateUserBelongsToCompanyByAuthId: jest.fn(),
  findOneByAuthId: jest.fn(),
  findOneById: jest.fn(),
  mapToUserRole: jest.fn(),
};

const mockEmailService = {
  sendInvitationEmail: jest.fn().mockResolvedValue({ success: true, data: { id: 'email-123' } }),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key) => {
    if (key === 'FRONTEND_URL') return 'https://app.consentia.io';
    return null;
  }),
};

describe('InvitationsService', () => {
  let service: InvitationsService;
  let authService: AuthService;
  let companyUsersService: CompanyUsersService;
  let emailService: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: CompanyUsersService,
          useValue: mockCompanyUsersService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    authService = module.get<AuthService>(AuthService);
    companyUsersService = module.get<CompanyUsersService>(CompanyUsersService);
    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an invitation successfully', async () => {
      // Arrange
      const createDto: CreateInvitationDto = {
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        message: 'Please join our platform',
      };

      const mockInvitation = {
        id: 'invitation-1',
        email: createDto.email,
        name: createDto.name,
        role: createDto.role,
        company_id: createDto.companyId,
        status: InvitationStatus.PENDING,
        created_by: 'admin-1',
        token: 'token-123',
        message: createDto.message,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock la verificación de invitación existente
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock la inserción de la nueva invitación
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      // Act
      const result = await service.create(createDto, 'admin-1');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'invitation-1');
      expect(result).toHaveProperty('email', createDto.email);
      expect(result).toHaveProperty('status', InvitationStatus.PENDING);
    });

    it('should throw ConflictException if invitation already exists', async () => {
      // Arrange
      const createDto: CreateInvitationDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
      };

      // Mock la verificación de invitación existente para encontrar una invitación
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'existing-invitation',
          email: createDto.email,
          company_id: createDto.companyId,
          status: InvitationStatus.PENDING,
        },
        error: null,
      });

      // Act & Assert
      await expect(service.create(createDto, 'admin-1')).rejects.toThrow(ConflictException);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return array of invitations with filters', async () => {
      // Arrange
      const mockInvitations = [
        {
          id: 'invitation-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: UserRole.OPERATOR,
          company_id: 'company-1',
          status: InvitationStatus.PENDING,
          created_by: 'admin-1',
          token: 'token-123',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'invitation-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: UserRole.MANAGER,
          company_id: 'company-1',
          status: InvitationStatus.PENDING,
          created_by: 'admin-1',
          token: 'token-456',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockInvitations,
        error: null,
      });

      // Act
      const result = await service.findAll('company-1', InvitationStatus.PENDING);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', 'company-1');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', InvitationStatus.PENDING);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('invitation-1');
      expect(result[1].id).toBe('invitation-2');
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Arrange
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
    });
  });

  describe('findOne', () => {
    it('should return an invitation by id', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-1',
        email: 'user1@example.com',
        name: 'User 1',
        role: UserRole.OPERATOR,
        company_id: 'company-1',
        status: InvitationStatus.PENDING,
        created_by: 'admin-1',
        token: 'token-123',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      // Act
      const result = await service.findOne('invitation-1');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'invitation-1');
      expect(mockSupabaseClient.single).toHaveBeenCalled();
      expect(result.id).toBe('invitation-1');
      expect(result.email).toBe('user1@example.com');
    });

    it('should throw NotFoundException when invitation not found', async () => {
      // Arrange
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      // Act & Assert
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'nonexistent-id');
    });
  });

  describe('accept', () => {
    it('should accept an invitation and create a new user', async () => {
      // Arrange
      const acceptDto: AcceptInvitationDto = {
        token: 'valid-token',
        password: 'password123',
        name: 'Updated Name',
      };

      const mockInvitation = {
        id: 'invitation-1',
        email: 'newuser@example.com',
        name: 'New User',
        role: UserRole.OPERATOR,
        company_id: 'company-1',
        status: InvitationStatus.PENDING,
        created_by: 'admin-1',
        token: 'valid-token',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockAcceptedInvitation = {
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
        user_id: 'new-user-id',
        accepted_at: new Date().toISOString(),
      };

      // Mock para encontrar la invitación por token
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      // Mock para el registro de usuario
      mockAuthService.register.mockResolvedValueOnce({
        user: {
          id: 'new-user-id',
          email: mockInvitation.email,
          user_metadata: {
            name: acceptDto.name,
          },
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      });

      // Mock para validateUserBelongsToCompanyByAuthId
      mockCompanyUsersService.validateUserBelongsToCompanyByAuthId.mockResolvedValueOnce(false);

      // Mock para crear usuario en la compañía
      mockCompanyUsersService.create.mockResolvedValueOnce({ 
        id: 'company-user-1',
        authId: 'new-user-id',
        companyId: mockInvitation.company_id,
      });

      // Mock para actualizar la invitación
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockAcceptedInvitation,
        error: null,
      });

      // Act
      const result = await service.accept(acceptDto);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('token', 'valid-token');
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: mockInvitation.email,
        name: acceptDto.name,
        password: acceptDto.password,
      });
      expect(mockCompanyUsersService.validateUserBelongsToCompanyByAuthId).toHaveBeenCalledWith(
        'new-user-id',
        mockInvitation.company_id
      );
      expect(mockCompanyUsersService.create).toHaveBeenCalled();
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(result.status).toBe(InvitationStatus.ACCEPTED);
      expect(result.userId).toBe('new-user-id');
    });

    it('should accept an invitation with existing user', async () => {
      // Arrange
      const acceptDto: AcceptInvitationDto = {
        token: 'valid-token',
      };

      const mockInvitation = {
        id: 'invitation-1',
        email: 'existinguser@example.com',
        name: 'Existing User',
        role: UserRole.OPERATOR,
        company_id: 'company-1',
        status: InvitationStatus.PENDING,
        created_by: 'admin-1',
        token: 'valid-token',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockAcceptedInvitation = {
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
        user_id: 'existing-user-id',
        accepted_at: new Date().toISOString(),
      };

      // Mock para encontrar la invitación por token
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      // Mock para validateUserBelongsToCompanyByAuthId
      mockCompanyUsersService.validateUserBelongsToCompanyByAuthId.mockResolvedValueOnce(true);

      // Mock para actualizar la invitación
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockAcceptedInvitation,
        error: null,
      });

      // Act
      const result = await service.accept(acceptDto, 'existing-user-id');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('token', 'valid-token');
      expect(mockAuthService.register).not.toHaveBeenCalled();
      expect(mockCompanyUsersService.validateUserBelongsToCompanyByAuthId).toHaveBeenCalledWith(
        'existing-user-id',
        mockInvitation.company_id
      );
      expect(mockCompanyUsersService.create).not.toHaveBeenCalled();
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(result.status).toBe(InvitationStatus.ACCEPTED);
      expect(result.userId).toBe('existing-user-id');
    });

    it('should throw BadRequestException if invitation is not pending', async () => {
      // Arrange
      const acceptDto: AcceptInvitationDto = {
        token: 'already-accepted-token',
        password: 'password123',
      };

      const mockInvitation = {
        id: 'invitation-1',
        email: 'user@example.com',
        name: 'User',
        role: UserRole.OPERATOR,
        company_id: 'company-1',
        status: InvitationStatus.ACCEPTED,
        created_by: 'admin-1',
        token: 'already-accepted-token',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock para encontrar la invitación por token
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      // Act & Assert
      await expect(service.accept(acceptDto)).rejects.toThrow(BadRequestException);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('token', 'already-accepted-token');
    });

    it('should throw BadRequestException if invitation is expired', async () => {
      // Arrange
      const acceptDto: AcceptInvitationDto = {
        token: 'expired-token',
        password: 'password123',
      };

      // Mock para findByToken - Debería devolver una invitación con fecha expirada
      jest.spyOn(service, 'findByToken').mockResolvedValueOnce({
        id: 'invitation-1',
        email: 'user@example.com',
        name: 'User',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        status: InvitationStatus.PENDING,
        createdBy: 'admin-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Expired date
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as InvitationDto);

      // Mock para actualizar el estado a expirado
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act & Assert
      await expect(service.accept(acceptDto)).rejects.toThrow(BadRequestException);
      expect(service.findByToken).toHaveBeenCalledWith('expired-token');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password is missing for new user', async () => {
      // Arrange
      const acceptDto: AcceptInvitationDto = {
        token: 'valid-token',
        // No password
      };

      const mockInvitation = {
        id: 'invitation-1',
        email: 'newuser@example.com',
        name: 'New User',
        role: UserRole.OPERATOR,
        company_id: 'company-1',
        status: InvitationStatus.PENDING,
        created_by: 'admin-1',
        token: 'valid-token',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock para encontrar la invitación por token
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitation,
        error: null,
      });

      // Act & Assert
      await expect(service.accept(acceptDto)).rejects.toThrow(BadRequestException);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('token', 'valid-token');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending invitation', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-1',
        email: 'user@example.com',
        name: 'User',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        status: InvitationStatus.PENDING,
        createdBy: 'admin-1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as InvitationDto;

      const mockCanceledInvitation = {
        ...mockInvitation,
        status: InvitationStatus.CANCELED,
        updated_at: new Date().toISOString(),
      };

      // Mock para encontrar la invitación
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockInvitation);

      // Mock para actualizar la invitación
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ...mockCanceledInvitation,
          company_id: mockCanceledInvitation.companyId,
          created_by: mockCanceledInvitation.createdBy,
          expires_at: mockCanceledInvitation.expiresAt,
          created_at: mockCanceledInvitation.createdAt,
        },
        error: null,
      });

      // Spy en el método transformToDto
      jest.spyOn(service as any, 'transformToDto').mockReturnValueOnce({
        ...mockInvitation,
        status: InvitationStatus.CANCELED,
      });

      // Act
      const result = await service.cancel('invitation-1');

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('invitation-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'invitation-1');
      expect(result.status).toBe(InvitationStatus.CANCELED);
    });

    it('should throw BadRequestException if invitation is not pending', async () => {
      // Arrange
      // Mock para encontrar la invitación
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'invitation-1',
        status: InvitationStatus.ACCEPTED,
        // ...resto de propiedades
      } as InvitationDto);

      // Act & Assert
      await expect(service.cancel('invitation-1')).rejects.toThrow(BadRequestException);
      expect(service.findOne).toHaveBeenCalledWith('invitation-1');
      expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });
  });

  describe('regenerateToken', () => {
    it('should regenerate token for a pending invitation', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-1',
        email: 'user@example.com',
        name: 'User',
        role: UserRole.OPERATOR,
        company_id: 'company-1',
        status: InvitationStatus.PENDING,
        created_by: 'admin-1',
        token: 'old-token',
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdatedInvitation = {
        ...mockInvitation,
        token: 'new-token',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock para encontrar la invitación
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: mockInvitation.id,
        email: mockInvitation.email,
        name: mockInvitation.name,
        role: mockInvitation.role,
        companyId: mockInvitation.company_id,
        status: mockInvitation.status,
        createdBy: mockInvitation.created_by,
        token: mockInvitation.token,
        expiresAt: mockInvitation.expires_at,
        createdAt: mockInvitation.created_at,
        updatedAt: mockInvitation.updated_at,
      } as InvitationDto);

      // Mock para actualizar la invitación
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockUpdatedInvitation,
        error: null,
      });

      // Act
      const result = await service.regenerateToken('invitation-1');

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('invitation-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('invitation');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'invitation-1');
      expect(result.token).not.toBe(mockInvitation.token);
      expect(result.expiresAt).not.toBe(mockInvitation.expires_at);
    });

    it('should throw BadRequestException if invitation is not pending', async () => {
      // Arrange
      // Mock para encontrar la invitación
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'invitation-1',
        status: InvitationStatus.ACCEPTED,
        // ...resto de propiedades
      } as InvitationDto);

      // Act & Assert
      await expect(service.regenerateToken('invitation-1')).rejects.toThrow(BadRequestException);
      expect(service.findOne).toHaveBeenCalledWith('invitation-1');
      expect(mockSupabaseClient.update).not.toHaveBeenCalled();
    });
  });
}); 