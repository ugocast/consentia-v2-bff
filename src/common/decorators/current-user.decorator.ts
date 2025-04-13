import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { ErrorCode } from '../interfaces/error-types.interface';

/**
 * Interfaz que representa al usuario autenticado
 * Esta interfaz se ha actualizado para alinearse con la respuesta de Supabase Auth
 */
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    onboarding_status?: string;
    [key: string]: any;
  };
  created_at?: string;
  app_metadata?: Record<string, any>;
  roles?: string[];
  company_id?: string;
}

/**
 * Decorador para obtener el usuario actual desde la solicitud
 * @param property - Propiedad específica del usuario que se quiere obtener (opcional)
 * 
 * @example
 * // Obtener el usuario completo
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * 
 * @example
 * // Obtener solo el ID del usuario
 * @Post()
 * create(@CurrentUser('id') userId: string) {
 *   return this.service.create(userId);
 * }
 * 
 * @example
 * // Obtener el nombre del usuario desde los metadatos
 * @Get('welcome')
 * welcome(@CurrentUser('user_metadata.name') name: string) {
 *   return `Bienvenido, ${name || 'Usuario'}`;
 * }
 */
export const CurrentUser = createParamDecorator(
  (propertyPath: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException({
        code: ErrorCode.UNAUTHORIZED,
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
  },
);

/**
 * @deprecated Utilizar CurrentUser('id') en su lugar
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new InternalServerErrorException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'ID de usuario no encontrado en la solicitud. Asegúrese de que JwtAuthGuard esté aplicado.',
      });
    }

    return user.id;
  },
);
