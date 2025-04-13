import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadatos para identificar rutas públicas
 * @internal Usado por JwtAuthGuard para permitir el acceso a rutas públicas
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar una ruta como pública, permitiendo el acceso sin autenticación
 * 
 * Ejemplo de uso:
 * ```typescript
 * @Public()
 * @Get('health-check')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); 