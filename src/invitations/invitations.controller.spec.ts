import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BadRequestException } from '@nestjs/common';
import { 
  CreateInvitationDto, 
  AcceptInvitationDto, 
  InvitationDto 
} from './dto';
import { InvitationStatus } from './enums/invitation-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';
import { Request } from 'express';

// Mock del servicio de invitaciones
const mockInvitationsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByToken: jest.fn(),
  accept: jest.fn(),
  cancel: jest.fn(),
  regenerateToken: jest.fn(),
};

// Mock de los guardias
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

// Función para crear un mock de RequestWithCompanyContext
function createMockRequest(companyId: string): Partial<RequestWithCompanyContext> {
  return {
    companyContext: { companyId },
    user: { id: 'admin-1' },
    get: jest.fn(),
    header: jest.fn(),
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    range: jest.fn(),
    // ... otros métodos requeridos por la interfaz Request
  } as unknown as Partial<RequestWithCompanyContext>;
}

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let service: InvitationsService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: mockInvitationsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<InvitationsController>(InvitationsController);
    service = module.get<InvitationsService>(InvitationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an invitation', async () => {
      // Arrange
      const createDto: CreateInvitationDto = {
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
      };

      const mockRequest = createMockRequest('company-1');

      const mockInvitation: InvitationDto = {
        id: 'invitation-1',
        email: createDto.email,
        name: createDto.name,
        role: createDto.role,
        companyId: createDto.companyId,
        status: InvitationStatus.PENDING,
        createdBy: 'admin-1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockInvitationsService.create.mockResolvedValue(mockInvitation);

      // Act
      const result = await controller.create(createDto, { id: 'admin-1' }, mockRequest as RequestWithCompanyContext);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createDto, 'admin-1');
      expect(result).toEqual(mockInvitation);
    });

    it('should throw BadRequestException if companyId mismatch', async () => {
      // Arrange
      const createDto: CreateInvitationDto = {
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.OPERATOR,
        companyId: 'company-2', // Different from context
      };

      const mockRequest = createMockRequest('company-1');

      // Act & Assert
      await expect(controller.create(createDto, { id: 'admin-1' }, mockRequest as RequestWithCompanyContext))
        .rejects.toThrow(BadRequestException);
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('findByCompany', () => {
    it('should return invitations for company', async () => {
      // Arrange
      const companyId = 'company-1';
      const status = InvitationStatus.PENDING;

      const mockInvitations: InvitationDto[] = [
        {
          id: 'invitation-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: UserRole.OPERATOR,
          companyId,
          status,
          createdBy: 'admin-1',
          token: 'token-123',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'invitation-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: UserRole.MANAGER,
          companyId,
          status,
          createdBy: 'admin-1',
          token: 'token-456',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockInvitationsService.findAll.mockResolvedValue(mockInvitations);

      // Act
      const result = await controller.findByCompany(companyId, status);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(companyId, status);
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('findOne', () => {
    it('should return an invitation by id', async () => {
      // Arrange
      const invitationId = 'invitation-1';

      const mockInvitation: InvitationDto = {
        id: invitationId,
        email: 'user1@example.com',
        name: 'User 1',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        status: InvitationStatus.PENDING,
        createdBy: 'admin-1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockInvitationsService.findOne.mockResolvedValue(mockInvitation);

      // Act
      const result = await controller.findOne(invitationId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(invitationId);
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('verifyToken', () => {
    it('should verify invitation token', async () => {
      // Arrange
      const token = 'valid-token';

      const mockInvitation: InvitationDto = {
        id: 'invitation-1',
        email: 'user1@example.com',
        name: 'User 1',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        status: InvitationStatus.PENDING,
        createdBy: 'admin-1',
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockInvitationsService.findByToken.mockResolvedValue(mockInvitation);

      // Act
      const result = await controller.verifyToken(token);

      // Assert
      expect(service.findByToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('accept', () => {
    it('should accept an invitation', async () => {
      // Arrange
      const acceptDto: AcceptInvitationDto = {
        token: 'valid-token',
        password: 'password123',
      };

      const mockInvitation: InvitationDto = {
        id: 'invitation-1',
        email: 'user1@example.com',
        name: 'User 1',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        status: InvitationStatus.ACCEPTED,
        createdBy: 'admin-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: new Date().toISOString(),
        userId: 'new-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockInvitationsService.accept.mockResolvedValue(mockInvitation);

      // Act
      const result = await controller.accept(acceptDto);

      // Assert
      expect(service.accept).toHaveBeenCalledWith(acceptDto);
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('cancel', () => {
    it('should cancel an invitation', async () => {
      // Arrange
      const invitationId = 'invitation-1';

      const mockInvitation: InvitationDto = {
        id: invitationId,
        email: 'user1@example.com',
        name: 'User 1',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        status: InvitationStatus.CANCELED,
        createdBy: 'admin-1',
        token: 'token-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockInvitationsService.cancel.mockResolvedValue(mockInvitation);

      // Act
      const result = await controller.cancel(invitationId);

      // Assert
      expect(service.cancel).toHaveBeenCalledWith(invitationId);
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('regenerateToken', () => {
    it('should regenerate invitation token', async () => {
      // Arrange
      const invitationId = 'invitation-1';

      const mockInvitation: InvitationDto = {
        id: invitationId,
        email: 'user1@example.com',
        name: 'User 1',
        role: UserRole.OPERATOR,
        companyId: 'company-1',
        status: InvitationStatus.PENDING,
        createdBy: 'admin-1',
        token: 'new-token-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockInvitationsService.regenerateToken.mockResolvedValue(mockInvitation);

      // Act
      const result = await controller.regenerateToken(invitationId);

      // Assert
      expect(service.regenerateToken).toHaveBeenCalledWith(invitationId);
      expect(result).toEqual(mockInvitation);
    });
  });
}); 