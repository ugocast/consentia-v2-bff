import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private supabase = createSupabaseClient();

  /**
   * Registra un nuevo usuario
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Registrar usuario en Supabase Auth
    const { data: authData, error: authError } =
      await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

    if (authError) {
      throw new Error(`Error al registrar usuario: ${authError.message}`);
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout(token: string) {
    // Configurar el cliente con el token de sesión
    const supabase = createSupabaseClient();
    supabase.auth.setSession({ access_token: token, refresh_token: '' });

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Solicita un restablecimiento de contraseña
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email } = resetPasswordDto;

    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      throw new Error(
        `Error al solicitar restablecimiento de contraseña: ${error.message}`,
      );
    }

    return {
      success: true,
      message: 'Se ha enviado un correo para restablecer la contraseña',
    };
  }

  /**
   * Actualiza la contraseña del usuario
   */
  async updatePassword(token: string, updatePasswordDto: UpdatePasswordDto) {
    // Configurar el cliente con el token de sesión
    const supabase = createSupabaseClient();
    supabase.auth.setSession({ access_token: token, refresh_token: '' });

    const { error } = await supabase.auth.updateUser({
      password: updatePasswordDto.password,
    });

    if (error) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`);
    }

    return { success: true, message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Verifica un token JWT
   */
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return data.user;
  }

  /**
   * Refresca un token JWT
   */
  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('No se pudo refrescar el token');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }
}
