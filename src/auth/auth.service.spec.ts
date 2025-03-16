import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { mockSupabaseClient } from '../common/mocks/supabase.mock';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from './dto/auth.dto';
import * as supabaseConfig from '../config/supabase.config';

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    // Configurar el mock para devolver el cliente de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(
      mockSupabaseClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
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
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
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

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it('should throw an error when registration fails', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Registration failed' },
      });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        'Error al registrar usuario: Registration failed',
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
      };

      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
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
    });
  });

  describe('logout', () => {
    it('should logout a user successfully', async () => {
      // Arrange
      const token = 'valid-token';

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Act
      const result = await service.logout(token);

      // Assert
      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: token,
        refresh_token: '',
      });
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw an error when logout fails', async () => {
      // Arrange
      const token = 'invalid-token';

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      // Act & Assert
      await expect(service.logout(token)).rejects.toThrow(
        'Error al cerrar sesión: Logout failed',
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
        error: null,
      });

      // Mock para la variable de entorno
      const originalEnv = process.env;
      process.env = { ...originalEnv, FRONTEND_URL: 'http://localhost:3001' };

      // Act
      const result = await service.resetPassword(resetPasswordDto);

      // Assert
      expect(
        mockSupabaseClient.auth.resetPasswordForEmail,
      ).toHaveBeenCalledWith(resetPasswordDto.email, {
        redirectTo: 'http://localhost:3001/reset-password',
      });

      expect(result).toEqual({
        success: true,
        message: 'Se ha enviado un correo para restablecer la contraseña',
      });

      // Restaurar variables de entorno
      process.env = originalEnv;
    });

    it('should throw an error when password reset request fails', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        email: 'nonexistent@example.com',
      };

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      });

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Error al solicitar restablecimiento de contraseña: User not found',
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

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        error: null,
      });

      // Act
      const result = await service.updatePassword(token, updatePasswordDto);

      // Assert
      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: token,
        refresh_token: '',
      });

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: updatePasswordDto.password,
      });

      expect(result).toEqual({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    });

    it('should throw an error when password update fails', async () => {
      // Arrange
      const token = 'invalid-token';
      const updatePasswordDto: UpdatePasswordDto = {
        password: 'NewPassword123!',
      };

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        error: { message: 'Password update failed' },
      });

      // Act & Assert
      await expect(
        service.updatePassword(token, updatePasswordDto),
      ).rejects.toThrow(
        'Error al actualizar contraseña: Password update failed',
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
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
      };

      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: refreshToken,
      });

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it('should throw UnauthorizedException when token refresh fails', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid refresh token' },
      });

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
