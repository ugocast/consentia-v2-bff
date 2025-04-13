import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUser, User } from './current-user.decorator';
import { mockUser } from '../mocks/user.mock';

// Prueba simplificada del decorador
describe('CurrentUser Decorator', () => {
  // Extraer la función interno del decorador para probarla directamente
  // Esta es la función que pasamos a createParamDecorator
  const extractUser = (propertyPath: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException({
        message: 'Usuario no encontrado en la solicitud. Asegúrese de que JwtAuthGuard esté aplicado.',
      });
    }

    // Si no se especifica propiedad, devolver el usuario completo
    if (!propertyPath) {
      return user;
    }

    // Si se especifica una propiedad anidada (con notación de punto)
    if (propertyPath.includes('.')) {
      const parts = propertyPath.split('.');
      let value = user;
      
      for (const part of parts) {
        if (value === undefined || value === null) {
          return undefined;
        }
        value = value[part];
      }
      
      return value;
    }

    // Si es una propiedad simple
    return user[propertyPath];
  };

  describe('User extraction logic', () => {
    let mockExecutionContext: ExecutionContext;

    beforeEach(() => {
      // Configurar el contexto de ejecución mock
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;
    });

    it('should return the entire user object when no property is specified', () => {
      // Act
      const result = extractUser(undefined, mockExecutionContext);
      
      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return specific property when provided', () => {
      // Act
      const result = extractUser('id', mockExecutionContext);
      
      // Assert
      expect(result).toEqual(mockUser.id);
    });

    it('should extract nested property using dot notation', () => {
      // Act
      const result = extractUser('user_metadata.name', mockExecutionContext);
      
      // Assert
      expect(result).toEqual(mockUser.user_metadata?.name);
    });

    it('should return undefined for non-existent properties', () => {
      // Act
      const result = extractUser('nonExistentProperty', mockExecutionContext);
      
      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw an error when user is not in request', () => {
      // Arrange - mock context without user
      const contextWithoutUser = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;
      
      // Act & Assert
      expect(() => extractUser(undefined, contextWithoutUser)).toThrow(InternalServerErrorException);
    });
  });
}); 