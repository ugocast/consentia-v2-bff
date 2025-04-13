import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  InternalServerErrorException, 
  BadRequestException, 
  ConflictException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { 
  CreateInvitationDto, 
  InvitationDto, 
  AcceptInvitationDto 
} from './dto';
import { InvitationStatus } from './enums/invitation-status.enum';
import { randomBytes } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { CompanyUsersService } from '../company-users/company-users.service';
import { CreateCompanyUserDto } from '../company-users/dto/create-company-user.dto';
import { CompanyUserRole } from '../company-users/dto/company-user-role.enum';
import { EmailService } from '../common/services/email/email.service';
import { ConfigService } from '@nestjs/config';

/**
 * Interfaz para representar una entidad de invitación en la base de datos
 */
interface InvitationEntity {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company_id: string;
  status: InvitationStatus;
  created_by: string;
  token: string;
  message?: string;
  metadata?: Record<string, any>;
  expires_at: string;
  accepted_at?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private supabase: SupabaseClient = createSupabaseClient({ useServiceKey: true });
  private frontendUrl: string;

  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    
    @Inject(forwardRef(() => CompanyUsersService))
    private readonly companyUsersService: CompanyUsersService,

    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://app.consentia.io';
  }

  /**
   * Crea una nueva invitación
   * @param createInvitationDto Datos para crear la invitación
   * @param createdBy ID del usuario que crea la invitación
   * @returns La invitación creada
   */
  async create(
    createInvitationDto: CreateInvitationDto,
    createdBy: string
  ): Promise<InvitationDto> {
    try {
      // Verificar si ya existe una invitación pendiente para este correo en esta compañía
      const { data: existingInvitation, error: checkError } = await this.supabase
        .from('invitation')
        .select('*')
        .eq('email', createInvitationDto.email)
        .eq('company_id', createInvitationDto.companyId)
        .eq('status', InvitationStatus.PENDING)
        .maybeSingle();
      
      if (checkError) {
        this.logger.error(`Error al verificar invitación existente: ${checkError.message}`, checkError);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al verificar invitación existente',
          originalError: checkError
        });
      }
      
      if (existingInvitation) {
        throw new ConflictException({
          code: ErrorCode.INVITATION_ALREADY_EXISTS,
          message: `Ya existe una invitación pendiente para ${createInvitationDto.email} en esta compañía`
        });
      }
      
      // Generar token único para la invitación
      const token = this.generateInvitationToken();
      
      // Calcular fecha de expiración (30 días por defecto)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const now = new Date().toISOString();
      
      // Crear la invitación en la base de datos
      const newInvitation: Partial<InvitationEntity> = {
        email: createInvitationDto.email,
        name: createInvitationDto.name,
        role: createInvitationDto.role,
        company_id: createInvitationDto.companyId,
        status: InvitationStatus.PENDING,
        created_by: createdBy,
        token: token,
        message: createInvitationDto.message,
        metadata: createInvitationDto.metadata || {},
        expires_at: expiresAt.toISOString(),
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await this.supabase
        .from('invitation')
        .insert(newInvitation)
        .select()
        .single();
      
      if (error) {
        this.logger.error(`Error al crear invitación: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al crear invitación',
          originalError: error
        });
      }
      
      // Obtener datos del invitador y la compañía para enviar el email
      await this.sendInvitationEmail(data as InvitationEntity);
      
      return this.transformToDto(data as InvitationEntity);
    } catch (error) {
      if (error instanceof ConflictException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error al crear invitación: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al crear invitación',
        originalError: error
      });
    }
  }

  /**
   * Busca todas las invitaciones con filtros opcionales
   * @param companyId ID de la compañía (opcional)
   * @param status Estado de las invitaciones (opcional)
   * @param email Email para filtrar (opcional)
   * @returns Lista de invitaciones
   */
  async findAll(
    companyId?: string,
    status?: InvitationStatus,
    email?: string
  ): Promise<InvitationDto[]> {
    try {
      let query = this.supabase
        .from('invitation')
        .select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (email) {
        query = query.eq('email', email);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        this.logger.error(`Error al buscar invitaciones: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al buscar invitaciones',
          originalError: error
        });
      }
      
      return (data as InvitationEntity[]).map(item => this.transformToDto(item));
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error al buscar invitaciones: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al buscar invitaciones',
        originalError: error
      });
    }
  }

  /**
   * Busca una invitación por su ID
   * @param id ID de la invitación
   * @returns La invitación encontrada
   */
  async findOne(id: string): Promise<InvitationDto> {
    try {
      const { data, error } = await this.supabase
        .from('invitation')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        this.logger.error(`Error al buscar invitación: ${error.message}`, error);
        throw new NotFoundException({
          code: ErrorCode.INVITATION_NOT_FOUND,
          message: `Invitación con ID ${id} no encontrada`,
          originalError: error
        });
      }
      
      return this.transformToDto(data as InvitationEntity);
    } catch (error) {
      if (error instanceof NotFoundException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error al buscar invitación: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `Error al buscar invitación con ID ${id}`,
        originalError: error
      });
    }
  }

  /**
   * Busca una invitación por su token
   * @param token Token de la invitación
   * @returns La invitación encontrada
   */
  async findByToken(token: string): Promise<InvitationDto> {
    try {
      const { data, error } = await this.supabase
        .from('invitation')
        .select('*')
        .eq('token', token)
        .single();
      
      if (error) {
        this.logger.error(`Error al buscar invitación por token: ${error.message}`, error);
        throw new NotFoundException({
          code: ErrorCode.INVITATION_NOT_FOUND,
          message: 'Invitación no encontrada o token inválido',
          originalError: error
        });
      }
      
      return this.transformToDto(data as InvitationEntity);
    } catch (error) {
      if (error instanceof NotFoundException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error al buscar invitación por token: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error al buscar invitación por token',
        originalError: error
      });
    }
  }

  /**
   * Cancela una invitación
   * @param id ID de la invitación
   * @returns La invitación cancelada
   */
  async cancel(id: string): Promise<InvitationDto> {
    try {
      // Verificar que la invitación existe y está pendiente
      const invitation = await this.findOne(id);
      
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException({
          code: ErrorCode.INVALID_INVITATION_STATUS,
          message: 'Solo se pueden cancelar invitaciones pendientes'
        });
      }
      
      const now = new Date().toISOString();
      
      // Actualizar estado de la invitación
      const { data, error } = await this.supabase
        .from('invitation')
        .update({
          status: InvitationStatus.CANCELED,
          updated_at: now
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        this.logger.error(`Error al cancelar invitación: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al cancelar invitación',
          originalError: error
        });
      }
      
      return this.transformToDto(data as InvitationEntity);
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error al cancelar invitación: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al cancelar invitación',
        originalError: error
      });
    }
  }

  /**
   * Mapea un UserRole a CompanyUserRole
   * @param role Rol del usuario
   * @returns Rol de compañía equivalente
   */
  private mapToCompanyUserRole(role: UserRole): CompanyUserRole {
    switch(role) {
      case UserRole.ADMIN:
        return CompanyUserRole.ADMIN;
      case UserRole.MANAGER:
        return CompanyUserRole.MANAGER;
      case UserRole.OPERATOR:
        return CompanyUserRole.OPERATOR;
      // Mapeamos AUDITOR a VIEWER ya que no existe rol AUDITOR en CompanyUserRole
      case UserRole.AUDITOR:
        return CompanyUserRole.VIEWER;
      // Por defecto asignamos VIEWER
      default:
        return CompanyUserRole.VIEWER;
    }
  }

  /**
   * Acepta una invitación
   * @param acceptInvitationDto Datos para aceptar la invitación
   * @param existingUserId ID del usuario que acepta la invitación (si ya existe)
   * @returns La invitación aceptada
   */
  async accept(
    acceptInvitationDto: AcceptInvitationDto,
    existingUserId?: string
  ): Promise<InvitationDto> {
    try {
      // Obtener la invitación por token
      const invitation = await this.findByToken(acceptInvitationDto.token);
      
      // Verificar que la invitación está pendiente
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException({
          code: ErrorCode.INVALID_INVITATION_STATUS,
          message: 'La invitación ya ha sido procesada o cancelada'
        });
      }
      
      // Verificar que la invitación no ha expirado
      const expiresAt = new Date(invitation.expiresAt);
      const now = new Date();
      
      if (expiresAt < now) {
        // Actualizar estado a expirado
        await this.supabase
          .from('invitation')
          .update({
            status: InvitationStatus.EXPIRED,
            updated_at: now.toISOString()
          })
          .eq('id', invitation.id);
        
        throw new BadRequestException({
          code: ErrorCode.INVITATION_EXPIRED,
          message: 'La invitación ha expirado'
        });
      }
      
      let userId = existingUserId;
      
      // Si no hay un usuario existente, tenemos que crear uno
      if (!userId) {
        if (!acceptInvitationDto.password) {
          throw new BadRequestException({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Se requiere una contraseña para crear un nuevo usuario'
          });
        }
        
        try {
          // Registrar el usuario directamente con Supabase Auth
          const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
            email: invitation.email,
            password: acceptInvitationDto.password,
            email_confirm: true, // Marcar el email como confirmado directamente
            user_metadata: {
              name: acceptInvitationDto.name || invitation.name,
              onboarding_status: 'REGISTERED'
            }
          });
          
          if (authError || !authData.user) {
            throw new Error(authError?.message || 'Error al crear usuario en Supabase Auth');
          }
          
          userId = authData.user.id;
          
          // Sincronizar los datos del usuario con el BFF
          if (userId) {
            try {
              await this.authService.syncUserData(userId, {
                name: acceptInvitationDto.name || invitation.name,
                onboardingStatus: 'EMAIL_VERIFIED' // Ya que la invitación valida el email
              });
            } catch (syncError) {
              this.logger.error(`Error al sincronizar datos del usuario: ${syncError.message}`, {
                userId,
                error: syncError,
              });
              // No bloqueamos el flujo por un error en la sincronización
            }
          }
          
          this.logger.log(`Usuario creado con ID: ${userId} para invitación: ${invitation.id}`);
        } catch (error) {
          this.logger.error(`Error al crear usuario para invitación: ${error.message}`, error);
          throw new BadRequestException({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Error al crear usuario. Es posible que el email ya esté registrado.',
            originalError: error
          });
        }
      }
      
      // Asignar el usuario a la compañía si existe el ID
      if (userId) {
        try {
          // Verificar si el usuario ya está asignado a la compañía
          const userBelongs = await this.companyUsersService.validateUserBelongsToCompanyByAuthId(
            userId,
            invitation.companyId
          );
          
          if (!userBelongs) {
            // Mapear el rol de UserRole a CompanyUserRole
            const companyRole = this.mapToCompanyUserRole(invitation.role);
            
            // Crear CompanyUser
            const createCompanyUserDto: CreateCompanyUserDto = {
              authId: userId,
              fullName: acceptInvitationDto.name || invitation.name,
              email: invitation.email,
              role: companyRole,
              metadata: invitation.metadata || {}
            };
            
            await this.companyUsersService.create(
              invitation.companyId,
              createCompanyUserDto,
              invitation.createdBy
            );
            
            this.logger.log(`Usuario asignado a compañía: ${invitation.companyId}`);
            
            // Actualizar el estado de onboarding del usuario
            try {
              const { error: updateError } = await this.supabase.auth.admin.updateUserById(
                userId,
                {
                  user_metadata: {
                    onboarding_status: 'COMPANY_ASSIGNED',
                    has_company: true
                  }
                }
              );
              
              if (updateError) {
                this.logger.error(`Error al actualizar estado de onboarding: ${updateError.message}`);
                // No interrumpimos el flujo, pero registramos el error
              }
            } catch (updateError) {
              this.logger.error(`Error al actualizar metadatos del usuario: ${updateError.message}`);
              // No interrumpimos el flujo, pero registramos el error
            }
          } else {
            this.logger.log(`El usuario ya pertenece a la compañía: ${invitation.companyId}`);
          }
        } catch (error) {
          this.logger.error(`Error al asignar usuario a compañía: ${error.message}`, error);
          // No interrumpimos el flujo, pero registramos el error
        }
      }
      
      // Registrar la aceptación de la invitación
      const { data, error } = await this.supabase
        .from('invitation')
        .update({
          status: InvitationStatus.ACCEPTED,
          user_id: userId || null,
          accepted_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', invitation.id)
        .select()
        .single();
      
      if (error) {
        this.logger.error(`Error al aceptar invitación: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al aceptar invitación',
          originalError: error
        });
      }
      
      return this.transformToDto(data as InvitationEntity);
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error al aceptar invitación: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al aceptar invitación',
        originalError: error
      });
    }
  }

  /**
   * Regenera el token de una invitación y reenvía el email
   */
  async regenerateToken(id: string): Promise<InvitationDto> {
    try {
      // Verificar si la invitación existe usando el método findOne 
      const invitation = await this.findOne(id);
      
      // Verificar que la invitación esté pendiente
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException({
          code: ErrorCode.INVALID_INVITATION_STATUS,
          message: 'Solo se pueden regenerar invitaciones pendientes'
        });
      }
      
      // Generar nuevo token
      const newToken = this.generateInvitationToken();
      
      // Actualizar fecha de expiración (extender por 30 días)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Actualizar en base de datos
      const { data: updatedInvitation, error } = await this.supabase
        .from('invitation')
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        this.logger.error(`Error al regenerar token: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al regenerar token',
          originalError: error
        });
      }
      
      // Reenviar email
      await this.sendInvitationEmail(updatedInvitation as InvitationEntity);
      
      return this.transformToDto(updatedInvitation as InvitationEntity);
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      
      this.logger.error(`Error al regenerar token: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al regenerar token',
        originalError: error
      });
    }
  }

  /**
   * Genera un token único para la invitación
   * @returns String con el token generado
   */
  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Transforma una entidad de invitación a DTO
   * @param entity Entidad de invitación
   * @returns DTO de invitación
   */
  private transformToDto(entity: InvitationEntity): InvitationDto {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      role: entity.role,
      companyId: entity.company_id,
      status: entity.status as InvitationStatus,
      createdBy: entity.created_by,
      token: entity.token,
      expiresAt: entity.expires_at,
      acceptedAt: entity.accepted_at,
      userId: entity.user_id,
      message: entity.message,
      metadata: entity.metadata || {},
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    };
  }

  /**
   * Envía el email de invitación
   * @param invitation Datos de la invitación
   */
  private async sendInvitationEmail(invitation: InvitationEntity): Promise<void> {
    try {
      // Obtener información del creador
      const { data: creatorData, error: creatorError } = await this.supabase
        .from('company_user')
        .select(`
          user_id, 
          auth_users:user_id (
            email,
            name
          )
        `)
        .eq('id', invitation.created_by)
        .single();
      
      if (creatorError) {
        this.logger.error(`Error al obtener datos del creador: ${creatorError.message}`);
        return;
      }
      
      // Obtener información de la compañía
      const { data: companyData, error: companyError } = await this.supabase
        .from('company')
        .select('name')
        .eq('id', invitation.company_id)
        .single();
      
      if (companyError) {
        this.logger.error(`Error al obtener datos de la compañía: ${companyError.message}`);
        return;
      }
      
      // Utilizamos optional chaining para acceder de forma segura
      const inviterName = creatorData?.auth_users?.[0]?.name || 'Un administrador';
      const companyName = companyData?.name || 'su compañía';
      
      // Crear link de invitación
      const invitationLink = `${this.frontendUrl}/invitations/accept?token=${invitation.token}`;
      
      // Enviar email
      const result = await this.emailService.sendInvitationEmail({
        email: invitation.email,
        inviterName,
        companyName,
        role: invitation.role,
        invitationLink,
        expirationDate: new Date(invitation.expires_at),
        customMessage: invitation.message
      });
      
      if (!result.success) {
        this.logger.error(`Error al enviar email de invitación: ${result.error?.message}`);
      } else {
        this.logger.log(`Email de invitación enviado a ${invitation.email} con ID: ${result.data?.id}`);
      }
    } catch (error) {
      this.logger.error(`Error al enviar email de invitación: ${error.message}`, error);
    }
  }
} 