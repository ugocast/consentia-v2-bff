import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuditService } from '../common/audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnboardingStatusResponseDto, SyncUserDataDto } from './dto';

// Mock del servicio de auditoría
const mockAuditService = {
  logEvent: jest.fn().mockResolvedValue(undefined),
};

// Mock del servicio de configuración
const mockConfigService = {
  get: jest.fn().mockImplementation((key) => {
    if (key === 'FRONTEND_URL') return 'http://localhost:3001';
    if (key === 'SUPABASE_URL') return 'https://mock-supabase.co';
    if (key === 'SUPABASE_ANON_KEY') return 'mock-anon-key';
    if (key === 'SUPABASE_SERVICE_KEY') return 'mock-service-key';
    return null;
  }),
};

// Mock del servicio JWT
const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

// Mock para Supabase
const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
  created_at: '2023-01-01T00:00:00.000Z',
};

// Mock para createSupabaseClient
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    admin: {
      getUserById: jest.fn(),
      updateUserById: jest.fn(),
    },
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
};

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn().mockImplementation(() => mockSupabase),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuditService, useValue: mockAuditService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: 'UsersService',
          useValue: {
            findByUserId: jest.fn()
          }
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyToken', () => {
    it('should verify a token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith(token);
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('user_metadata');
      expect(result.user_metadata).toHaveProperty('name', 'Test User');
    });

    it('should validate that token is not empty', async () => {
      // Arrange
      const token = '';

      // Act & Assert
      await expect(service.verifyToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      // Arrange
      const token = 'invalid-token';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      // Act & Assert
      await expect(service.verifyToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith(token);
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const token = 'token-without-user';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act & Assert
      await expect(service.verifyToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith(token);
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return complete onboarding status', async () => {
      // Arrange
      const userId = 'user-1';

      // Mock para obtener el usuario
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'user@example.com',
            email_confirmed_at: '2023-01-01T00:00:00.000Z', // Email verificado
            user_metadata: {},
          },
        },
        error: null,
      });

      // Mock para contar compañías del usuario
      mockSupabase.eq.mockImplementation(() => ({
        count: jest.fn().mockResolvedValue({
          count: 2,
          error: null,
        }),
      }));

      // Act
      const result = await service.getOnboardingStatus(userId);

      // Assert
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith(userId);
      expect(mockSupabase.from).toHaveBeenCalledWith('company_user');
      expect(result).toEqual({
        hasVerifiedEmail: true,
        hasCompany: true,
        companies: [],
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';

      // Mock para obtener el usuario (no encontrado)
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'User not found',
        },
      });

      // Act & Assert
      await expect(service.getOnboardingStatus(userId)).rejects.toThrow(BadRequestException);
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith(userId);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('syncUserData', () => {
    it('should sync user data successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const syncUserDataDto: SyncUserDataDto = {
        name: 'New User Name',
        onboardingStatus: 'COMPLETED',
      };

      // Mock para obtener usuario
      mockSupabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: userId,
            email: 'user@example.com',
            user_metadata: {
              name: 'Old Name',
            },
          },
        },
        error: null,
      });

      // Mock para actualizar usuario
      mockSupabase.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: userId,
          },
        },
        error: null,
      });

      // Mock para obtener usuario actualizado
      mockSupabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: userId,
            email: 'user@example.com',
            user_metadata: {
              name: 'New User Name',
              onboarding_status: 'COMPLETED',
            },
          },
        },
        error: null,
      });

      // Act
      const result = await service.syncUserData(userId, syncUserDataDto);

      // Assert
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledTimes(2);
      expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        { user_metadata: expect.any(Object) }
      );
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('userData.name', 'New User Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const syncUserDataDto: SyncUserDataDto = {
        name: 'New User Name',
      };

      mockSupabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: null },
        error: {
          message: 'User not found',
        },
      });

      // Act & Assert
      await expect(service.syncUserData(userId, syncUserDataDto)).rejects.toThrow(NotFoundException);
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith(userId);
      expect(mockSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
    });
  });
});
