import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el ID del usuario actual desde la solicitud
 * @example
 * @Get('profile')
 * getProfile(@CurrentUserId() userId: string) {
 *   return this.usersService.getProfile(userId);
 * }
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
); 