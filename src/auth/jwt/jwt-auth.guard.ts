import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { createSupabaseClient } from '../../config/supabase.config';

/**
 * Guardia para verificar la autenticación JWT
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private supabase = createSupabaseClient();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verificar el token JWT con Supabase
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        this.logger.warn(`Token inválido: ${error?.message}`);
        throw new UnauthorizedException('Token de autenticación inválido');
      }

      // Añadir el usuario a la solicitud para que esté disponible en los controladores
      request.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user',
        name: data.user.user_metadata?.name || 'Usuario',
      };

      return true;
    } catch (error) {
      this.logger.error('Error al verificar token JWT', error);
      throw new UnauthorizedException('Error al verificar la autenticación');
    }
  }
}
