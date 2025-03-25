import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export interface User {
  id: string;
  email?: string;
  roles?: string[];
  company_id?: string;
  name?: string;
  metadata?: Record<string, any>;
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
 */
export const CurrentUser = createParamDecorator(
  (property: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException(
        'Usuario no encontrado en la solicitud. Asegúrese de que JwtAuthGuard esté aplicado.',
      );
    }

    return property ? user[property] : user;
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
      throw new InternalServerErrorException(
        'ID de usuario no encontrado en la solicitud. Asegúrese de que JwtAuthGuard esté aplicado.',
      );
    }

    return user.id;
  },
);
