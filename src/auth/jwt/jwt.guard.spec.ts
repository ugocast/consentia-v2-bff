import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { AuthService } from '../auth.service';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let authService: AuthService;

  beforeEach(async () => {
    // Arrange - Setup
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtGuard,
        {
          provide: AuthService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtGuard>(JwtGuard);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    // Assert
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when token is valid', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
        user: undefined,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
        },
        created_at: new Date().toISOString(),
      };

      jest.spyOn(authService, 'verifyToken').mockResolvedValue(mockUser);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when no authorization header is provided', async () => {
      // Arrange
      const mockRequest = {
        headers: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('No se proporcionó token de autenticación'),
      );
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when authorization header is empty', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: '',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('No se proporcionó token de autenticación'),
      );
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      jest.spyOn(authService, 'verifyToken').mockRejectedValue(new Error('Token inválido'));

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Token inválido o expirado'),
      );
      expect(authService.verifyToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should properly extract the token from the authorization header', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'Bearer test-token-123',
        },
        user: undefined,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
        },
        created_at: new Date().toISOString(),
      };

      jest.spyOn(authService, 'verifyToken').mockResolvedValue(mockUser);

      // Act
      await guard.canActivate(mockContext);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith('test-token-123');
    });
  });
});
