import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { createSupabaseClient } from '../../config/supabase.config';

@Injectable()
export class JwtAuthGuard {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private supabase = createSupabaseClient();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Token de autenticación no proporcionado');
      throw new UnauthorizedException('Token de autenticación no proporcionado');
    }

    const token = authHeader.replace('Bearer ', '');
    this.logger.debug(`Verificando token: ${token.substring(0, 20)}...`);

    try {
      // Verificar el token JWT con Supabase directamente
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        this.logger.error(`Token inválido: ${error?.message}`);
        throw new UnauthorizedException('Token de autenticación inválido');
      }

      // Añadir el usuario a la solicitud para que esté disponible en los controladores
      request.user = data.user;
      this.logger.debug(`Usuario autenticado: ${data.user.id}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Error al verificar token: ${error.message}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
} 