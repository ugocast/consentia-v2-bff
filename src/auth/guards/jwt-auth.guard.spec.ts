import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { mockRequestWithUser } from '../../common/mocks/user.mock';
import { ErrorCode } from '../../common/interfaces/error-types.interface';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: AuthService;
  let reflector: Reflector;
  
  const mockUser = { 
    id: 'user-123', 
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    created_at: '2023-01-01T00:00:00Z'
  };
  const mockToken = 'valid.jwt.token';
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockImplementation(() => ({
          getRequest: jest.fn().mockImplementation(() => mockRequest),
        })),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('should allow access for public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should throw UnauthorizedException when Authorization header is missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
      
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      
      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error) {
        expect(error.response).toEqual({
          code: ErrorCode.INVALID_TOKEN,
          message: 'Token de autenticación no proporcionado',
        });
      }
    });

    it('should throw UnauthorizedException when Authorization header has incorrect format', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
      mockRequest.headers.authorization = 'InvalidFormat';
      
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should validate token and return true for valid token', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
      mockRequest.headers.authorization = `Bearer ${mockToken}`;
      jest.spyOn(authService, 'verifyToken').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
      mockRequest.headers.authorization = `Bearer ${mockToken}`;
      
      const error = new Error('Invalid token');
      error['response'] = {
        metadata: {
          originalError: 'invalid_token'
        }
      };
      
      jest.spyOn(authService, 'verifyToken').mockRejectedValue(error);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle and map Supabase error codes correctly', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
      mockRequest.headers.authorization = `Bearer ${mockToken}`;
      
      const error = new Error('Token expired');
      error['response'] = {
        metadata: {
          originalError: 'expired_token'
        }
      };
      
      jest.spyOn(authService, 'verifyToken').mockRejectedValue(error);

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error) {
        expect(error.response.code).toBe(ErrorCode.TOKEN_EXPIRED);
      }
    });
  });
});

/**
 * Función auxiliar para crear un mock del contexto de ejecución
 */
function createMockContext(request?: any): ExecutionContext {
  const mockRequest = request || {};
  
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
} 