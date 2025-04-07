import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  RegisterResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  ResetPasswordResponseDto,
  UpdatePasswordResponseDto,
  RefreshTokenResponseDto,
  VerifyTokenResponseDto
} from './dto';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction, ResourceType } from '../common/audit/audit.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase = createSupabaseClient();

  constructor(private readonly auditService: AuditService) {}

  /**
   * Registra un nuevo usuario
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, name, companyId } = registerDto;
    
    try {
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              // Si se proporciona un ID de compañía, lo guardamos en los metadatos
              ...(companyId && { companyId }),
            },
          },
        });

      if (authError) {
        this.logger.error(`Error al registrar usuario: ${authError.message}`, {
          email,
          error: authError,
        });
        
        if (authError.message.includes('already exists')) {
          throw new ConflictException({
            code: ErrorCode.EMAIL_ALREADY_EXISTS,
            message: 'El email ya está registrado',
          });
        }
        
        throw new InternalServerErrorException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Error al registrar usuario',
          metadata: { originalError: authError.message },
        });
      }

      // Si se proporciona un ID de compañía, asignamos el usuario a la compañía
      if (companyId && authData.user) {
        try {
          // Verificar si hay otros usuarios en la compañía
          const { data: existingUsers, error: countError } = await this.supabase
            .from('company_user')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);
          
          // Determinar el rol inicial (primer usuario = ADMIN, otros = USER)
          const initialRole = (!existingUsers || existingUsers.length === 0) 
            ? 'ADMIN' 
            : 'USER';

          // Crear registro en company_user
          const { error: companyUserError } = await this.supabase
            .from('company_user')
            .insert({
              company_id: companyId,
              auth_id: authData.user.id,
              email: email,
              full_name: name,
              role: initialRole,
              status: 'ACTIVE',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (companyUserError) {
            this.logger.error(`Error al asignar usuario a compañía: ${companyUserError.message}`, {
              userId: authData.user.id,
              companyId,
              error: companyUserError,
            });
            // No fallamos el registro por esto, pero lo registramos
          }
        } catch (companyError) {
          this.logger.error(`Error al procesar asignación de compañía: ${companyError.message}`, {
            userId: authData.user?.id,
            companyId,
            error: companyError,
          });
          // No fallamos el registro por esto, pero lo registramos
        }
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.REGISTER,
        resourceType: ResourceType.USER,
        resourceId: authData.user?.id || 'unknown',
        userId: authData.user?.id || 'system',
        metadata: { 
          email,
          success: true,
          companyId: companyId || undefined,
        },
      });

      return {
        user: {
          id: authData.user?.id || '',
          email: authData.user?.email || '',
          user_metadata: {
            name: authData.user?.user_metadata?.name || '',
            companyId: companyId || undefined,
          },
          created_at: authData.user?.created_at || '',
        },
        session: {
          access_token: authData.session?.access_token || '',
          refresh_token: authData.session?.refresh_token || '',
          expires_at: authData.session?.expires_at || 0,
        },
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof UnauthorizedException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }

      // Registrar evento de auditoría fallido
      await this.auditService.logEvent({
        action: AuditAction.REGISTER,
        resourceType: ResourceType.USER,
        resourceId: 'unknown',
        userId: 'system',
        metadata: { 
          email,
          success: false,
          error: error.message,
        },
      });
      
      this.logger.error('Error inesperado al registrar usuario', {
        email,
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al registrar usuario',
        metadata: { originalError: error.message },
      });
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.warn(`Intento de login fallido: ${error.message}`, {
          email,
          reason: error.message,
        });
        
        // Registrar evento de auditoría fallido
        await this.auditService.logEvent({
          action: AuditAction.LOGIN,
          resourceType: ResourceType.USER,
          resourceId: 'unknown',
          userId: 'system',
          metadata: { 
            email,
            success: false,
            reason: error.message,
          },
        });
        
        throw new UnauthorizedException({
          code: ErrorCode.UNAUTHORIZED,
          message: 'Credenciales inválidas',
          metadata: { reason: 'invalid_credentials' },
        });
      }

      // Registrar evento de auditoría exitoso
      await this.auditService.logEvent({
        action: AuditAction.LOGIN,
        resourceType: ResourceType.USER,
        resourceId: data.user?.id || 'unknown',
        userId: data.user?.id || 'system',
        metadata: { 
          email,
          success: true,
        },
      });

      return {
        user: {
          id: data.user?.id || '',
          email: data.user?.email || '',
          user_metadata: {
            name: data.user?.user_metadata?.name || '',
          },
          created_at: data.user?.created_at || '',
        },
        session: {
          access_token: data.session?.access_token || '',
          refresh_token: data.session?.refresh_token || '',
          expires_at: data.session?.expires_at || 0,
        },
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Error inesperado al iniciar sesión', {
        email,
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al iniciar sesión',
        metadata: { originalError: error.message },
      });
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout(token: string): Promise<LogoutResponseDto> {
    try {
      // Verificar el token para obtener información del usuario
      const user = await this.verifyToken(token);
      
      // Configurar el cliente con el token de sesión
      const supabase = createSupabaseClient();
      supabase.auth.setSession({ access_token: token, refresh_token: '' });

      const { error } = await supabase.auth.signOut();

      if (error) {
        this.logger.error(`Error al cerrar sesión: ${error.message}`, {
          userId: user.id,
          error,
        });
        
        throw new InternalServerErrorException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Error al cerrar sesión',
          metadata: { originalError: error.message },
        });
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.LOGOUT,
        resourceType: ResourceType.USER,
        resourceId: user.id,
        userId: user.id,
        metadata: { 
          email: user.email,
          success: true,
        },
      });

      return { success: true, message: 'Sesión cerrada correctamente' };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof UnauthorizedException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error('Error inesperado al cerrar sesión', {
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al cerrar sesión',
        metadata: { originalError: error.message },
      });
    }
  }

  /**
   * Solicita un restablecimiento de contraseña
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const { email } = resetPasswordDto;

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) {
        this.logger.error(`Error al solicitar restablecimiento de contraseña: ${error.message}`, {
          email,
          error,
        });
        
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Error al solicitar restablecimiento de contraseña',
          metadata: { originalError: error.message },
        });
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.RESET_PASSWORD,
        resourceType: ResourceType.USER,
        resourceId: 'unknown', // No tenemos el ID en este punto
        userId: 'system',
        metadata: { 
          email,
          success: true,
        },
      });

      return {
        success: true,
        message: 'Se ha enviado un correo para restablecer la contraseña',
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error('Error inesperado al solicitar restablecimiento de contraseña', {
        email,
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al solicitar restablecimiento de contraseña',
        metadata: { originalError: error.message },
      });
    }
  }

  /**
   * Actualiza la contraseña del usuario
   */
  async updatePassword(token: string, updatePasswordDto: UpdatePasswordDto): Promise<UpdatePasswordResponseDto> {
    try {
      // Verificar el token para obtener información del usuario
      const user = await this.verifyToken(token);
      
      // Configurar el cliente con el token de sesión
      const supabase = createSupabaseClient();
      supabase.auth.setSession({ access_token: token, refresh_token: '' });

      const { error } = await supabase.auth.updateUser({
        password: updatePasswordDto.password,
      });

      if (error) {
        this.logger.error(`Error al actualizar contraseña: ${error.message}`, {
          userId: user.id,
          error,
        });
        
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Error al actualizar contraseña',
          metadata: { originalError: error.message },
        });
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.CHANGE_PASSWORD,
        resourceType: ResourceType.USER,
        resourceId: user.id,
        userId: user.id,
        metadata: { 
          email: user.email,
          success: true,
        },
      });

      return { success: true, message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof UnauthorizedException || 
          error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error('Error inesperado al actualizar contraseña', {
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al actualizar contraseña',
        metadata: { originalError: error.message },
      });
    }
  }

  /**
   * Verifica un token JWT
   */
  async verifyToken(token: string): Promise<VerifyTokenResponseDto> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        this.logger.warn(`Token inválido o expirado: ${error.message}`, {
          error,
        });
        
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_TOKEN,
          message: 'Token inválido o expirado',
          metadata: { originalError: error.message },
        });
      }

      return {
        id: data.user?.id || '',
        email: data.user?.email || '',
        user_metadata: {
          name: data.user?.user_metadata?.name || '',
        },
        created_at: data.user?.created_at || '',
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Error inesperado al verificar token', {
        error,
      });
      
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_TOKEN,
        message: 'Error al verificar token',
        metadata: { originalError: error.message },
      });
    }
  }

  /**
   * Refresca un token JWT
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        this.logger.warn(`No se pudo refrescar el token: ${error.message}`, {
          error,
        });
        
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_TOKEN,
          message: 'No se pudo refrescar el token',
          metadata: { originalError: error.message },
        });
      }

      // Registrar evento de auditoría
      if (data.user) {
        await this.auditService.logEvent({
          action: AuditAction.LOGIN, // Consideramos el refresh como una extensión del login
          resourceType: ResourceType.USER,
          resourceId: data.user?.id || 'unknown',
          userId: data.user?.id || 'system',
          metadata: { 
            email: data.user?.email,
            success: true,
            refresh: true, // Indicamos que es un refresh, no un login normal
          },
        });
      }

      return {
        user: {
          id: data.user?.id || '',
          email: data.user?.email || '',
          user_metadata: {
            name: data.user?.user_metadata?.name || '',
          },
          created_at: data.user?.created_at || '',
        },
        session: {
          access_token: data.session?.access_token || '',
          refresh_token: data.session?.refresh_token || '',
          expires_at: data.session?.expires_at || 0,
        },
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Error inesperado al refrescar token', {
        error,
      });
      
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_TOKEN,
        message: 'Error al refrescar token',
        metadata: { originalError: error.message },
      });
    }
  }
}
