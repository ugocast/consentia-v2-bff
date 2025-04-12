import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { UpdateUserDto, UserDto } from './dto/user.dto';
import { SelectActiveCompanyDto, ActiveCompanyResponseDto } from './dto/select-active-company.dto';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction, ResourceType } from '../common/audit/audit.types';

@Injectable()
export class UsersService {
  private supabase = createSupabaseClient();
  private supabaseAdmin = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

  /**
   * Obtiene el perfil del usuario actual
   */
  async getCurrentUser(userId: string): Promise<UserDto> {
    // Obtenemos los datos de autenticación
    const { data: authData, error: authError } =
      await this.supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authData.user) {
      throw new NotFoundException(
        `Usuario no encontrado: ${authError?.message}`,
      );
    }

    // Creamos el objeto de usuario con los datos de autenticación
    const userData: UserDto = {
      id: authData.user.id,
      email: authData.user.email || '',
      name: authData.user.user_metadata?.name || 'Usuario',
      created_at: authData.user.created_at || new Date().toISOString(),
      updated_at: authData.user.updated_at || new Date().toISOString(),
    };

    return userData;
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const updates: any = { ...updateUserDto };

    // Si se actualiza el email, lo hacemos a través de la API de autenticación
    if (updates.email) {
      const { error: authError } =
        await this.supabaseAdmin.auth.admin.updateUserById(userId, {
          email: updates.email,
        });

      if (authError) {
        throw new Error(`Error al actualizar email: ${authError.message}`);
      }
    }

    // Si se actualiza el nombre, lo hacemos a través de la API de autenticación
    if (updates.name) {
      const { error: metadataError } =
        await this.supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { name: updates.name },
        });

      if (metadataError) {
        throw new Error(`Error al actualizar nombre: ${metadataError.message}`);
      }
    }

    // Devolvemos el usuario actualizado
    return this.getCurrentUser(userId);
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(userId: string): Promise<{ success: boolean }> {
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }

    return { success: true };
  }

  async getAllUsers() {
    // Obtener todos los usuarios de Supabase
    const { data, error } = await this.supabase.auth.admin.listUsers();
    
    if (error) {
      throw new InternalServerErrorException(
        `Error al obtener usuarios: ${error.message}`,
      );
    }
    
    return data.users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || '',
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
    }));
  }

  /**
   * Establece la compañía activa para un usuario
   * @param userId ID del usuario
   * @param selectActiveCompanyDto DTO con el ID de la compañía a establecer como activa
   * @returns Respuesta con los datos de la compañía activa
   */
  async setActiveCompany(
    userId: string,
    selectActiveCompanyDto: SelectActiveCompanyDto,
  ): Promise<ActiveCompanyResponseDto> {
    const { companyId } = selectActiveCompanyDto;

    try {
      // Verificar que el usuario pertenece a la compañía
      const { data: companyUserData, error: companyUserError } = await this.supabase
        .from('company_user')
        .select('id, company:company_id(id, name)')
        .eq('auth_id', userId)
        .eq('company_id', companyId)
        .single();

      if (companyUserError || !companyUserData) {
        throw new BadRequestException({
          code: ErrorCode.FORBIDDEN,
          message: 'El usuario no pertenece a la compañía seleccionada',
          metadata: companyUserError ? { originalError: companyUserError.message } : undefined,
        });
      }

      // Verificar si ya existe un registro de compañía activa
      const { data: existingData, error: existingError } = await this.supabase
        .from('user_active_company')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existingData) {
        // Actualizar el registro existente
        const { error: updateError } = await this.supabase
          .from('user_active_company')
          .update({
            company_id: companyId,
            updated_at: now,
          })
          .eq('id', existingData.id);

        if (updateError) {
          throw new InternalServerErrorException({
            code: ErrorCode.DATABASE_ERROR,
            message: 'Error al actualizar la compañía activa',
            metadata: { originalError: updateError.message },
          });
        }
      } else {
        // Crear un nuevo registro
        const { error: insertError } = await this.supabase
          .from('user_active_company')
          .insert({
            user_id: userId,
            company_id: companyId,
            created_at: now,
            updated_at: now,
          });

        if (insertError) {
          throw new InternalServerErrorException({
            code: ErrorCode.DATABASE_ERROR,
            message: 'Error al establecer la compañía activa',
            metadata: { originalError: insertError.message },
          });
        }
      }

      // También actualizamos los metadatos del usuario para facilitar el acceso
      const { error: updateUserError } = await this.supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            active_company_id: companyId,
            onboarding_status: 'ONBOARDING_COMPLETED'
          },
        }
      );

      if (updateUserError) {
        // No fallamos la operación, pero lo registramos
        console.error('Error al actualizar metadatos de usuario:', updateUserError.message);
      }

      // Registrar evento de auditoría
      await this.auditService.logEvent({
        action: AuditAction.SET_ACTIVE_COMPANY,
        resourceType: ResourceType.USER,
        resourceId: userId,
        userId: userId,
        metadata: { 
          companyId,
          success: true,
        },
      });

      return {
        success: true,
        message: 'Compañía activa establecida correctamente',
        companyId,
        companyName: companyUserData.company ? companyUserData.company[0]?.name : 'Compañía',
      };
    } catch (error) {
      // Si el error ya es una excepción de NestJS, la relanzamos
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al establecer la compañía activa',
        metadata: { originalError: error.message },
      });
    }
  }
}
