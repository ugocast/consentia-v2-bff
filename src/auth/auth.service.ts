import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, BadRequestException, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { JwtService } from '@nestjs/jwt';
import { OnboardingStatusResponseDto, SyncUserDataDto, SyncUserDataResponseDto, VerifyTokenResponseDto, AuthErrorResponseDto } from './dto';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction, ResourceType } from '../common/audit/audit.types';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de autenticación
 * Maneja la verificación de tokens y las operaciones relacionadas con el usuario
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase = createSupabaseClient();
  private supabaseAdmin = createSupabaseClient({ useServiceKey: true });
  private frontendUrl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://app.consentia.io';
  }

  /**
   * Verifica un token JWT de Supabase
   * 
   * Utiliza la API de Supabase para verificar si el token es válido y 
   * obtener los datos del usuario asociado.
   * 
   * @param token Token JWT a verificar
   * @returns Datos del usuario autenticado
   * @throws UnauthorizedException si el token es inválido o ha expirado
   */
  async verifyToken(token: string): Promise<VerifyTokenResponseDto> {
    try {
      // Validar que el token no esté vacío
      if (!token || token.trim() === '') {
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_TOKEN,
          message: 'Token no proporcionado',
        });
      }

      // Utilizar Supabase Auth para verificar el token
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

      if (!data.user) {
        this.logger.warn('Token válido pero no se encontró usuario asociado');
        
        throw new UnauthorizedException({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'No se encontró usuario asociado al token',
        });
      }

      // Registrar auditoría de verificación exitosa
      await this.auditService.logEvent({
        action: AuditAction.LOGIN,
        resourceType: ResourceType.USER,
        resourceId: data.user.id,
        userId: data.user.id,
        metadata: { success: true, authMethod: 'jwt' },
      }).catch(error => {
        // No fallar el proceso si la auditoría falla
        this.logger.error(`Error al registrar evento de auditoría: ${error.message}`);
      });

      // Extraer y devolver solo los datos necesarios para nuestra aplicación
      return {
        id: data.user.id,
        email: data.user.email || '',
        user_metadata: {
          name: data.user.user_metadata?.name || '',
          ...data.user.user_metadata
        },
        created_at: data.user.created_at || '',
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

  /**
   * Sincroniza los datos de usuario entre Supabase y las tablas del dominio en el BFF
   */
  async syncUserData(userId: string, syncUserDataDto: any): Promise<any> {
    try {
      // Obtener el usuario actual de Supabase
      const { data: authData, error: authError } =
        await this.supabaseAdmin.auth.admin.getUserById(userId);

      if (authError || !authData.user) {
        this.logger.error(`Error al obtener usuario de Supabase: ${authError?.message}`, {
          userId,
          error: authError,
        });
        
        throw new NotFoundException({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'Usuario no encontrado',
        });
      }

      // Actualizar metadatos en Supabase si se proporcionaron
      if (syncUserDataDto.name || syncUserDataDto.onboardingStatus) {
        const userMetadata = { ...authData.user.user_metadata };
        
        if (syncUserDataDto.name) {
          userMetadata.name = syncUserDataDto.name;
        }
        
        if (syncUserDataDto.onboardingStatus) {
          userMetadata.onboarding_status = syncUserDataDto.onboardingStatus;
        }

        const { error: updateError } = await this.supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: userMetadata }
        );

        if (updateError) {
          this.logger.error(`Error al actualizar metadatos de usuario: ${updateError.message}`, {
            userId,
            error: updateError,
          });
          
          throw new InternalServerErrorException({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Error al actualizar datos de usuario',
            metadata: { originalError: updateError.message },
          });
        }
      }

      // Obtener el usuario actualizado
      const { data: updatedAuthData, error: updatedAuthError } =
        await this.supabaseAdmin.auth.admin.getUserById(userId);

      if (updatedAuthError || !updatedAuthData.user) {
        throw new InternalServerErrorException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Error al obtener usuario actualizado',
        });
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.UPDATE,
        resourceType: ResourceType.USER,
        resourceId: userId,
        userId: userId,
        metadata: { success: true, syncUserDataDto },
      });

      return {
        success: true,
        message: 'Datos de usuario sincronizados correctamente',
        userData: {
          id: updatedAuthData.user.id,
          email: updatedAuthData.user.email,
          name: updatedAuthData.user.user_metadata?.name,
          onboardingStatus: updatedAuthData.user.user_metadata?.onboarding_status,
        },
      };
    } catch (error) {
      // Registrar evento de auditoría fallido
      await this.auditService.logEvent({
        action: AuditAction.UPDATE,
        resourceType: ResourceType.USER,
        resourceId: userId,
        userId: userId,
        metadata: { 
          success: false, 
          error: error.message,
          syncUserDataDto 
        },
      });
      
      if (error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al sincronizar datos de usuario',
        metadata: { originalError: error.message },
      });
    }
  }
}
