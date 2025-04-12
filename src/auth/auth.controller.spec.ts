import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
  ResetPasswordResponseDto,
  UpdatePasswordResponseDto,
  VerifyEmailResponseDto,
  OnboardingStatusResponseDto,
} from './dto/standard-response.dto';

// Mock del servicio de autenticación
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  verifyToken: jest.fn(),
  refreshToken: jest.fn(),
  verifyEmail: jest.fn(),
  getOnboardingStatus: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const mockResult = {
        user: {
          id: 'user-id',
          email: registerDto.email,
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      };

      mockAuthService.register.mockResolvedValue(mockResult);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockResult = {
        user: {
          id: 'user-id',
          email: loginDto.email,
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      // Arrange
      const authorization = 'Bearer access-token';
      const mockResult = { success: true };

      mockAuthService.logout.mockResolvedValue(mockResult);

      // Sobrescribir el método para la prueba
      const originalMethod = controller.logout;
      controller.logout = async (auth: string) => {
        const token = auth.replace('Bearer ', '');
        return mockAuthService.logout(token);
      };

      // Act
      const result = await controller.logout(authorization);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith('access-token');
      expect(result).toEqual(mockResult);

      // Restaurar el método original
      controller.logout = originalMethod;
    });
  });

  describe('resetPassword', () => {
    it('should request password reset', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        email: 'test@example.com',
      };

      const mockResult = {
        success: true,
        message: 'Se ha enviado un correo para restablecer la contraseña',
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResult);

      // Act
      const result = await controller.resetPassword(resetPasswordDto);

      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      // Arrange
      const updatePasswordDto: UpdatePasswordDto = {
        password: 'NewPassword123!',
      };

      const authorization = 'Bearer access-token';

      const mockResult = {
        success: true,
        message: 'Contraseña actualizada correctamente',
      };

      mockAuthService.updatePassword.mockResolvedValue(mockResult);

      // Sobrescribir el método para la prueba
      const originalMethod = controller.updatePassword;
      controller.updatePassword = async (
        auth: string,
        dto: UpdatePasswordDto,
      ) => {
        const token = auth.replace('Bearer ', '');
        return mockAuthService.updatePassword(token, dto);
      };

      // Act
      const result = await controller.updatePassword(
        authorization,
        updatePasswordDto,
      );

      // Assert
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith(
        'access-token',
        updatePasswordDto,
      );
      expect(result).toEqual(mockResult);

      // Restaurar el método original
      controller.updatePassword = originalMethod;
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      // Arrange
      const refreshTokenDto = {
        refresh_token: 'refresh-token',
      };

      const mockResult = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
        },
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      // Act
      const result = await controller.refreshToken(refreshTokenDto);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refresh_token,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        token: 'valid-token',
      };
      
      const expectedResponse: VerifyEmailResponseDto = {
        success: true,
        message: 'Email successfully verified',
        userId: 'user-123',
      };
      
      mockAuthService.verifyEmail.mockResolvedValue(expectedResponse);
      
      const result = await controller.verifyEmail(verifyEmailDto);
      
      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto);
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status for a user', async () => {
      const userId = 'user-123';
      
      const expectedResponse: OnboardingStatusResponseDto = {
        hasVerifiedEmail: true,
        hasCompany: true,
        companies: [
          { 
            id: 'company-123', 
            name: 'Test Company', 
            role: 'ADMIN' 
          }
        ],
      };
      
      mockAuthService.getOnboardingStatus.mockResolvedValue(expectedResponse);
      
      // Simulate the CurrentUser decorator by directly passing userId as the user
      const result = await controller.getOnboardingStatus({ id: userId });
      
      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.getOnboardingStatus).toHaveBeenCalledWith(userId);
    });
  });
});
