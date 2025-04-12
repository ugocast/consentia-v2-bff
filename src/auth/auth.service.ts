import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { JwtService } from '@nestjs/jwt';
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
  VerifyEmailDto,
  VerifyEmailResponseDto,
  OnboardingStatusResponseDto
} from './dto';
import { VerifyTokenResponseDto } from './dto/standard-response.dto';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction, ResourceType } from '../common/audit/audit.types';
import { UsersService } from '../users/users.service';
import { EmailService } from '../common/services/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase = createSupabaseClient();
  private frontendUrl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://app.consentia.io';
  }

  /**
   * Registra un nuevo usuario
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, name } = registerDto;
    
    try {
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              onboarding_status: 'REGISTERED'
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

      // Enviar email de verificación
      if (authData.user) {
        await this.sendVerificationEmail(authData.user.id, email, name);
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.REGISTER,
        resourceType: ResourceType.USER,
        resourceId: authData.user?.id || 'unknown',
        userId: authData.user?.id || 'system',
        metadata: { 
          email,
          success: true
        },
      });

      return {
        user: {
          id: authData.user?.id || '',
          email: authData.user?.email || '',
          user_metadata: {
            name: authData.user?.user_metadata?.name || '',
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
   * Envía un email de verificación al usuario
   * @param userId ID del usuario
   * @param email Email del usuario
   * @param name Nombre del usuario
   */
  private async sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
    try {
      // Generar OTP para verificación de email
      const { data, error } = await this.supabase.auth.admin.generateLink({
        type: 'email_change_new',
        email: email,
        newEmail: email, // Es el mismo email, solo para generar el OTP
        options: {
          redirectTo: `${this.frontendUrl}/auth/verify-email`
        }
      });

      if (error || !data.properties?.email_otp) {
        this.logger.error(`Error al generar token de verificación: ${error?.message}`, {
          userId,
          email,
          error,
        });
        return;
      }

      const verificationToken = data.properties.email_otp;
      const verificationLink = `${this.frontendUrl}/auth/verify-email?token=${verificationToken}`;
      
      // Enviar email usando el servicio de email
      const result = await this.emailService.sendVerificationEmail({
        email,
        name,
        verificationLink,
        expirationHours: 24
      });

      if (!result.success) {
        this.logger.error(`Error al enviar email de verificación: ${result.error?.message}`, {
          userId,
          email,
          error: result.error,
        });
      } else {
        this.logger.log(`Email de verificación enviado a ${email} con ID: ${result.data?.id}`);
      }
    } catch (error) {
      this.logger.error(`Error al enviar email de verificación: ${error.message}`, {
        userId,
        email,
        error,
      });
    }
  }

  /**
   * Reenvía el email de verificación
   * @param userId ID del usuario
   */
  async resendVerificationEmail(userId: string): Promise<{ success: boolean, message: string }> {
    try {
      // Obtener datos del usuario
      const { data: userData, error: userError } = await this.supabase.auth.admin
        .getUserById(userId);

      if (userError || !userData.user) {
        this.logger.error(`Error al obtener usuario: ${userError?.message || 'Usuario no encontrado'}`, {
          userId,
          error: userError,
        });
        
        throw new BadRequestException({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'Usuario no encontrado',
          metadata: userError ? { originalError: userError.message } : undefined,
        });
      }

      // Verificar si el email ya está verificado
      const isEmailVerified = 
        userData.user.email_confirmed_at !== null || 
        userData.user.user_metadata?.email_verified === true;

      if (isEmailVerified) {
        return {
          success: true,
          message: 'El email ya está verificado'
        };
      }

      // Enviar email de verificación
      const email = userData.user.email || '';
      const name = userData.user.user_metadata?.name || 'Usuario';
      
      await this.sendVerificationEmail(userId, email, name);

      return {
        success: true,
        message: 'Email de verificación enviado'
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error inesperado al reenviar email de verificación: ${error.message}`, {
        userId,
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al reenviar email de verificación',
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

  /**
   * Verifica el email de un usuario utilizando el token de verificación
   * @param verifyEmailDto DTO con el token de verificación
   * @returns Resultado de la verificación
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    const { token } = verifyEmailDto;
    
    try {
      // Verificar la validez del token de verificación
      const { data, error } = await this.supabase.auth.verifyOtp({
        token,
        type: 'email',
        email: '' // El email se extrae del token, pero el API requiere este campo
      });

      if (error) {
        this.logger.error(`Error al verificar email: ${error.message}`, {
          token,
          error: error,
        });
        
        throw new BadRequestException({
          code: ErrorCode.INVALID_TOKEN,
          message: 'Token de verificación inválido o expirado',
          metadata: { originalError: error.message },
        });
      }

      if (!data.user) {
        throw new BadRequestException({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'No se encontró el usuario asociado a este token',
        });
      }

      // Actualizar el estado de verificación en los metadatos del usuario
      const { error: updateError } = await this.supabase.auth.updateUser({
        data: {
          email_verified: true,
          onboarding_status: 'EMAIL_VERIFIED'
        }
      });

      if (updateError) {
        this.logger.error(`Error al actualizar estado de verificación: ${updateError.message}`, {
          userId: data.user.id,
          error: updateError,
        });
        
        // No fallamos la operación, pero lo registramos
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.EMAIL_VERIFIED,
        resourceType: ResourceType.USER,
        resourceId: data.user.id,
        userId: data.user.id,
        metadata: { 
          email: data.user.email,
          success: true,
        },
      });

      return {
        success: true,
        message: 'Email verificado correctamente',
        userId: data.user.id,
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error inesperado al verificar email: ${error.message}`, {
        token,
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al verificar email',
        metadata: { originalError: error.message },
      });
    }
  }

  /**
   * Obtiene el estado de onboarding de un usuario
   * @param userId ID del usuario
   * @returns Estado de onboarding
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatusResponseDto> {
    try {
      // Obtener datos del usuario desde Supabase Auth
      const { data: userData, error: userError } = await this.supabase.auth.admin
        .getUserById(userId);

      if (userError || !userData.user) {
        this.logger.error(`Error al obtener usuario: ${userError?.message || 'Usuario no encontrado'}`, {
          userId,
          error: userError,
        });
        
        throw new BadRequestException({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'Usuario no encontrado',
          metadata: userError ? { originalError: userError.message } : undefined,
        });
      }

      // Verificar si el email está verificado
      const hasVerifiedEmail = 
        userData.user.email_confirmed_at !== null || 
        userData.user.user_metadata?.email_verified === true;

      // Consulta separada para contar compañías
      const { count, error: countError } = await this.supabase
        .from('company_user')
        .select('*', { count: 'exact', head: true })
        .eq('auth_id', userId);

      if (countError) {
        this.logger.error(`Error al contar compañías del usuario: ${countError.message}`, {
          userId,
          error: countError,
        });
      }

      // Respuesta simplificada
      return {
        hasVerifiedEmail,
        hasCompany: count ? count > 0 : false,
        companies: [], // Simplificamos para la fase 1, se añadirán detalles en la fase 3
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error inesperado al obtener estado de onboarding: ${error.message}`, {
        userId,
        error,
      });
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al obtener estado de onboarding',
        metadata: { originalError: error.message },
      });
    }
  }
}
