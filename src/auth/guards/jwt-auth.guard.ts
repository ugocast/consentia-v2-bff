import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AuthService } from '../auth.service';
import { ErrorCode, mapSupabaseErrorToErrorCode } from '../../common/interfaces/error-types.interface';

/**
 * Guard que verifica la autenticación mediante tokens JWT de Supabase
 * 
 * Este guard es proporcionado globalmente por el AuthModule y se usa para proteger
 * rutas que requieren autenticación. Admite rutas marcadas como públicas con el 
 * decorador @Public().
 */
@Injectable()
export class JwtAuthGuard {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Si la ruta es pública, permitir el acceso sin verificar el token
    if (isPublic) {
      this.logger.debug('Acceso a ruta pública permitido sin autenticación');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Verificar que el header de autorización exista y tenga el formato correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Token de autenticación no proporcionado o con formato incorrecto');
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_TOKEN,
        message: 'Token de autenticación no proporcionado'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    // Ocultamos parte del token en los logs por seguridad
    const maskedToken = token.substring(0, 15) + '...' + token.substring(token.length - 5);
    this.logger.debug(`Verificando token: ${maskedToken}`);

    try {
      // Verificar el token JWT usando el servicio de autenticación
      const user = await this.authService.verifyToken(token);
      
      // Añadir el usuario a la solicitud para que esté disponible en los controladores
      request.user = user;
      this.logger.debug(`Usuario autenticado correctamente: ${user.id}`);

      return true;
    } catch (error) {
      // Extraer el código de error original de Supabase si está disponible
      let supabaseErrorCode = 'unknown';
      if (error?.response?.metadata?.originalError) {
        supabaseErrorCode = error.response.metadata.originalError;
      }
      
      // Mapear el error de Supabase a nuestro sistema de códigos de error
      const errorCode = mapSupabaseErrorToErrorCode(supabaseErrorCode);
      
      this.logger.error(`Error al verificar token: ${error.message}`, {
        stack: error.stack,
        path: request.path,
        method: request.method,
        supabaseErrorCode,
        errorCode
      });
      
      // Lanzar UnauthorizedException con información estructurada
      throw new UnauthorizedException({
        code: errorCode,
        message: error.message || 'Token inválido o expirado',
        metadata: { 
          originalError: supabaseErrorCode,
          path: request.path 
        }
      });
    }
  }
}
