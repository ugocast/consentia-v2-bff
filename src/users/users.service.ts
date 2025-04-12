import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { UpdateUserDto, UserDto, CreateUserCompanyDto, UserCompanyResponseDto } from './dto';
import { SelectActiveCompanyDto, ActiveCompanyResponseDto } from './dto/select-active-company.dto';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction, ResourceType } from '../common/audit/audit.types';
import { CompaniesService } from '../companies/companies.service';
import { CreateCompanyDto } from '../companies/dto';
import { CompanyUserRole, CompanyUserStatus } from '../company-users/dto';

@Injectable()
export class UsersService {
  private supabase = createSupabaseClient();
  private supabaseAdmin = createSupabaseClient({ useServiceKey: true });

  constructor(
    private readonly auditService: AuditService,
    private readonly companiesService: CompaniesService
  ) {}

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

  /**
   * Crea una nueva empresa para un usuario registrado
   * @param userId ID del usuario que crea la empresa
   * @param createUserCompanyDto DTO con los datos para crear la empresa
   * @returns Respuesta con los datos de la empresa y el usuario
   */
  async createUserCompany(
    userId: string,
    createUserCompanyDto: CreateUserCompanyDto,
  ): Promise<UserCompanyResponseDto> {
    try {
      // 1. Obtener datos del usuario
      const user = await this.getCurrentUser(userId);
      
      // 2. Transformar DTO a formato esperado por CompaniesService
      const createCompanyDto: CreateCompanyDto = {
        name: createUserCompanyDto.name,
        description: createUserCompanyDto.description,
        contact_email: createUserCompanyDto.contactEmail,
        phone: createUserCompanyDto.phone,
        address: createUserCompanyDto.address,
        subscription_plan: createUserCompanyDto.subscriptionPlan,
        metadata: createUserCompanyDto.metadata,
      };
      
      // 3. Crear la empresa
      const company = await this.companiesService.create(createCompanyDto, userId);
      
      // 4. Crear el vínculo company_user con rol ADMINISTRATOR
      const now = new Date().toISOString();
      
      const { data: companyUserData, error: companyUserError } = await this.supabase
        .from('company_user')
        .insert({
          company_id: company.id,
          auth_id: userId,
          full_name: user.name,
          email: user.email,
          role: CompanyUserRole.ADMINISTRATOR,
          status: CompanyUserStatus.ACTIVE,
          created_at: now,
          updated_at: now,
          created_by: userId,
        })
        .select()
        .single();
      
      if (companyUserError) {
        // Si hay error al crear company_user, intentamos eliminar la empresa creada
        try {
          await this.supabase.from('company').delete().eq('id', company.id);
        } catch (deleteError) {
          console.error('Error al eliminar empresa tras fallar creación de company_user:', deleteError);
        }
        
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al crear el vínculo entre usuario y empresa',
          metadata: { originalError: companyUserError.message },
        });
      }
      
      // 5. Establecer la empresa como activa
      await this.setActiveCompany(userId, { companyId: company.id });
      
      // 6. Actualizar metadatos del usuario para reflejar onboarding completado
      const { error: updateUserError } = await this.supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            active_company_id: company.id,
            onboarding_status: 'ONBOARDING_COMPLETED'
          },
        }
      );

      if (updateUserError) {
        console.error('Error al actualizar metadatos de usuario:', updateUserError.message);
        // No fallamos la operación por este error
      }
      
      // 7. Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.CREATE_COMPANY,
        resourceType: ResourceType.COMPANY,
        resourceId: company.id,
        userId,
        metadata: {
          companyName: company.name,
          userName: user.name,
          userEmail: user.email,
        },
      });
      
      // 8. Devolver respuesta
      return {
        success: true,
        message: 'Empresa creada correctamente',
        companyId: company.id,
        companyName: company.name,
        subscriptionPlan: company.subscription_plan,
        companyUserId: companyUserData.id,
        role: CompanyUserRole.ADMINISTRATOR,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al crear empresa para el usuario',
        metadata: { originalError: error.message },
      });
    }
  }
}
