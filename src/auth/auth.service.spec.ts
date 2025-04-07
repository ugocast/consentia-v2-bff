import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { mockSupabaseClient, resetSupabaseMocks } from '../common/mocks/supabase.mock';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from './dto/auth.dto';
import * as supabaseConfig from '../config/supabase.config';
import { AuditService } from '../common/audit/audit.service';
import { ErrorCode } from '../common/interfaces/error-types.interface';

// Mock del servicio de auditoría
const mockAuditService = {
  logEvent: jest.fn().mockResolvedValue(undefined),
};

// Extender el mockSupabaseClient para incluir auth
mockSupabaseClient.auth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
  setSession: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  updateUser: jest.fn(),
  refreshSession: jest.fn(),
};

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Arrange
    originalEnv = process.env;
    process.env = { ...originalEnv, FRONTEND_URL: 'http://localhost:3001' };
    
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    resetSupabaseMocks();

    // Resetear los mocks de auth
    Object.keys(mockSupabaseClient.auth).forEach(key => {
      mockSupabaseClient.auth[key].mockReset();
    });

    // Configurar el mock para devolver el cliente de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(
      mockSupabaseClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    // Restaurar variables de entorno
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const mockUser = {
        id: 'user-id',
        email: registerDto.email,
        user_metadata: { name: registerDto.name },
        created_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: new Date().getTime() / 1000 + 3600,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            name: registerDto.name,
          },
        },
      });

      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          user_metadata: { name: mockUser.user_metadata.name },
          created_at: mockUser.created_at,
        },
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
          expires_at: mockSession.expires_at,
        },
      });
    });

    it('should register a user with company assignment', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        companyId: 'company-id',
      };

      const mockUser = {
        id: 'user-id',
        email: registerDto.email,
        user_metadata: { 
          name: registerDto.name,
          companyId: registerDto.companyId,
        },
        created_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: new Date().getTime() / 1000 + 3600,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      // Simular consulta para comprobar si hay usuarios en la compañía
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.execute.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Simular inserción del usuario en la compañía
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.execute.mockResolvedValueOnce({
        data: { id: 'company-user-id' },
        error: null
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            name: registerDto.name,
            companyId: registerDto.companyId,
          },
        },
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result.user.user_metadata).toHaveProperty('companyId', registerDto.companyId);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      });

      // Configurar mock para el registro de auditoría
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException when registration fails with unknown error', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Some unknown error' },
      });

      // Configurar mock para el registro de auditoría
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-id',
        email: loginDto.email,
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: new Date().getTime() / 1000 + 3600,
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      // Configurar mock de consulta de usuario en empresa
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.execute.mockResolvedValue({
        data: [{ 
          id: 'company-user-id',
          company_id: 'company-id',
          role: 'ADMIN',
          status: 'ACTIVE',
        }],
        error: null
      });

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });

      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result.session).toHaveProperty('access_token', mockSession.access_token);
    });

    it('should throw UnauthorizedException when login fails', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuditService.logEvent).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout a user successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock para verifyToken
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Act
      const result = await service.logout(token);

      // Assert
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(token);
      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: token,
        refresh_token: '',
      });
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toEqual({ 
        success: true,
        message: 'Sesión cerrada correctamente'
      });
    });

    it('should throw an error when session initialization fails', async () => {
      // Arrange
      const token = 'invalid-token';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock para verifyToken
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token' },
      });

      // Configurar mock para el registro de auditoría
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.logout(token)).rejects.toThrow(
        'Error inesperado al cerrar sesión'
      );
    });
  });

  describe('resetPassword', () => {
    it('should request password reset successfully', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      const result = await service.resetPassword(resetPasswordDto);

      // Assert
      expect(
        mockSupabaseClient.auth.resetPasswordForEmail,
      ).toHaveBeenCalledWith(resetPasswordDto.email, {
        redirectTo: 'http://localhost:3001/reset-password',
      });
      
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Se ha enviado un correo para restablecer la contraseña',
      });
    });

    it('should throw an error when password reset request fails', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        email: 'nonexistent@example.com',
      };

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'User not found' },
      });

      // Configurar mock para el registro de auditoría
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Error al solicitar restablecimiento de contraseña'
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const updatePasswordDto: UpdatePasswordDto = {
        password: 'NewPassword123!',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock para verifyToken
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: { 
          session: {
            user: { id: 'user-id' },
          },
        },
        error: null,
      });

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      // Act
      const result = await service.updatePassword(token, updatePasswordDto);

      // Assert
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(token);
      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: token,
        refresh_token: '',
      });
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: updatePasswordDto.password,
      });
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    });

    it('should throw an error when token is invalid', async () => {
      // Arrange
      const token = 'invalid-token';
      const updatePasswordDto: UpdatePasswordDto = {
        password: 'NewPassword123!',
      };
      
      // Mock para verifyToken que falla
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      // Act & Assert
      await expect(service.updatePassword(token, updatePasswordDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });

    it('should throw an error when session initialization fails', async () => {
      // Arrange
      const token = 'valid-token';
      const updatePasswordDto: UpdatePasswordDto = {
        password: 'NewPassword123!',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock para verifyToken
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token' },
      });

      // Configurar mock para el registro de auditoría
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.updatePassword(token, updatePasswordDto)).rejects.toThrow(
        'Error inesperado al actualizar contraseña'
      );
    });

    it('should throw an error when password update fails', async () => {
      // Arrange
      const token = 'valid-token';
      const updatePasswordDto: UpdatePasswordDto = {
        password: 'weak',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      // Mock para verifyToken
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: { 
          session: {
            user: { id: 'user-id' },
          },
        },
        error: null,
      });

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password too weak' },
      });

      // Configurar mock para el registro de auditoría
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.updatePassword(token, updatePasswordDto)).rejects.toThrow(
        'Error al actualizar contraseña'
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: new Date().toISOString(),
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(token);
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('user_metadata');
      expect(result.user_metadata).toHaveProperty('name', 'Test User');
      expect(result).toHaveProperty('created_at');
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      // Arrange
      const token = 'invalid-token';

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      // Act & Assert
      await expect(service.verifyToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: new Date().toISOString(),
      };
      
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: new Date().getTime() / 1000 + 3600,
      };

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { 
          user: mockUser,
          session: mockSession 
        },
        error: null,
      });

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: refreshToken,
      });
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          user_metadata: {
            name: mockUser.user_metadata.name,
          },
          created_at: mockUser.created_at,
        },
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
          expires_at: mockSession.expires_at,
        },
      });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token' },
      });

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
