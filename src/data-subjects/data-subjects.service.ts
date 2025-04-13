import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import * as crypto from 'crypto';
import {
  DataSubjectDto,
  CreateDataSubjectDto,
  UpdateDataSubjectDto,
  DataSubjectStatus,
  PortalAccessRequestDto,
  PortalVerificationDto,
  DataDeletionRequestDto,
  ConsentHistoryDto,
  ConsentPreferencesDto,
  DataAccessRequestDto,
  DataAccessResponseDto,
  DataRectificationRequestDto,
  DataRequestStatus
} from './dto';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';
import { ConsentStatus } from '../consents/dto/consent-status.enum';
import { handleNestedProperty, safeArrayMap, safeMetadata, safeValue } from '../common/utils/data-transforms.util';
import { ConsentEntity, DataSubjectEntity, DataTypeEntity } from '../common/interfaces/supabase-responses.interface';
import { ErrorCode } from '../common/interfaces/error-types.interface';
import { EmailService } from '../common/services/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DataSubjectsService {
  private readonly logger = new Logger(DataSubjectsService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Crea un nuevo titular de datos
   * @param createDataSubjectDto - Datos para crear el titular de datos
   * @param userId - ID del usuario que crea el titular (opcional)
   * @returns Titular de datos creado
   */
  async create(createDataSubjectDto: CreateDataSubjectDto, userId?: string): Promise<DataSubjectDto> {
    try {
      // Verificar si ya existe un titular con el mismo email
      const { data: existingSubject, error: checkError } = await this.supabase
        .from('data_subject')
        .select('id')
        .eq('email', createDataSubjectDto.email)
        .single();

      if (checkError && !checkError.message.includes('No rows found')) {
        this.logger.error(`Error al verificar existencia de titular: ${checkError.message}`, checkError);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al verificar existencia de titular de datos',
          originalError: checkError
        });
      }

      if (existingSubject) {
        throw new BadRequestException({
          code: ErrorCode.EMAIL_ALREADY_EXISTS,
          message: `Ya existe un titular de datos con el email ${createDataSubjectDto.email}`
        });
      }

      const now = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from('data_subject')
        .insert({
          full_name: createDataSubjectDto.fullName,
          email: createDataSubjectDto.email,
          phone: createDataSubjectDto.phone,
          external_id: createDataSubjectDto.externalId,
          company_id: createDataSubjectDto.companyId,
          status: createDataSubjectDto.status || DataSubjectStatus.ACTIVE,
          verified: createDataSubjectDto.verified || false,
          metadata: createDataSubjectDto.metadata || {},
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error al crear titular de datos: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al crear titular de datos',
          originalError: error
        });
      }

      // Registrar en auditoría
      if (userId) {
        await this.auditService.log({
          action: AuditAction.CREATE,
          resourceType: ResourceType.USER,
          resourceId: data.id,
          userId,
          metadata: {
            email: data.email,
            name: data.full_name,
          },
        });
      }

      return this.transformToDto(data as DataSubjectEntity);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al crear titular de datos: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al crear titular de datos',
        originalError: error
      });
    }
  }

  /**
   * Encuentra todos los titulares de datos con filtros opcionales
   * @param companyId - ID de la compañía para filtrar (opcional)
   * @param status - Estado para filtrar (opcional)
   * @returns Lista de titulares de datos
   */
  async findAll(companyId?: string, status?: DataSubjectStatus): Promise<DataSubjectDto[]> {
    try {
      let query = this.supabase
        .from('data_subject')
        .select('*');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error al buscar titulares de datos: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al buscar titulares de datos',
          originalError: error
        });
      }

      return safeArrayMap(data as DataSubjectEntity[], item => this.transformToDto(item));
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al buscar titulares de datos: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al buscar titulares de datos',
        originalError: error
      });
    }
  }

  /**
   * Encuentra todos los titulares de datos con filtros avanzados
   * @param filters - Objeto con filtros avanzados
   * @returns Lista de titulares de datos que cumplen con los criterios
   */
  async findAllAdvanced(filters: {
    companyId?: string;
    status?: DataSubjectStatus;
    email?: string;
    name?: string;
    verified?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    externalId?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: DataSubjectDto[]; total: number }> {
    try {
      const {
        companyId,
        status,
        email,
        name,
        verified,
        createdAfter,
        createdBefore,
        externalId,
        limit = 10,
        offset = 0,
        sortBy = 'created_at',
        sortDirection = 'desc',
      } = filters;

      // Preparar la consulta con contador
      const countQuery = this.supabase
        .from('data_subject')
        .select('*', { count: 'exact', head: true });

      // Consulta principal
      let query = this.supabase
        .from('data_subject')
        .select('*');

      // Aplicar filtros
      if (companyId) {
        query = query.eq('company_id', companyId);
        countQuery.eq('company_id', companyId);
      }

      if (status) {
        query = query.eq('status', status);
        countQuery.eq('status', status);
      }

      if (email) {
        query = query.ilike('email', `%${email}%`);
        countQuery.ilike('email', `%${email}%`);
      }

      if (name) {
        query = query.or(`full_name.ilike.%${name}%`);
        countQuery.or(`full_name.ilike.%${name}%`);
      }

      if (verified !== undefined) {
        query = query.eq('verified', verified);
        countQuery.eq('verified', verified);
      }

      if (createdAfter) {
        query = query.gte('created_at', createdAfter);
        countQuery.gte('created_at', createdAfter);
      }

      if (createdBefore) {
        query = query.lte('created_at', createdBefore);
        countQuery.lte('created_at', createdBefore);
      }

      if (externalId) {
        query = query.eq('external_id', externalId);
        countQuery.eq('external_id', externalId);
      }

      // Aplicar paginación y ordenamiento
      query = query
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(offset, offset + limit - 1);

      // Obtener resultados y total
      const [{ data, error }, countResult] = await Promise.all([
        query,
        countQuery,
      ]);

      const { count, error: countError } = countResult || { count: 0, error: null };

      if (error || countError) {
        this.logger.error(`Error al buscar titulares de datos: ${error?.message || countError?.message}`, error || countError);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al buscar titulares de datos',
          originalError: error || countError
        });
      }

      return {
        data: safeArrayMap(data as DataSubjectEntity[], item => this.transformToDto(item)),
        total: count ?? 0,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al buscar titulares de datos: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al buscar titulares de datos',
        originalError: error
      });
    }
  }

  /**
   * Busca titulares de datos por nombre
   * @param name - Nombre o parte del nombre a buscar
   * @param companyId - ID de la compañía (opcional)
   * @returns Lista de titulares que coinciden con el nombre
   */
  async findByName(name: string, companyId?: string): Promise<DataSubjectDto[]> {
    try {
      if (!name || name.trim() === '') {
        throw new BadRequestException({
          code: ErrorCode.INVALID_INPUT,
          message: 'El nombre de búsqueda es requerido'
        });
      }

      let query = this.supabase
        .from('data_subject')
        .select('*')
        .ilike('full_name', `%${name}%`);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error al buscar titulares por nombre: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al buscar titulares por nombre',
          originalError: error
        });
      }

      return safeArrayMap(data as DataSubjectEntity[], item => this.transformToDto(item));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al buscar titulares por nombre: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al buscar titulares por nombre',
        originalError: error
      });
    }
  }

  /**
   * Busca titulares de datos por criterios múltiples (búsqueda general)
   * @param term - Término de búsqueda general (email, nombre, teléfono, ID externo)
   * @param companyId - ID de la compañía (opcional)
   * @returns Lista de titulares que coinciden con el término
   */
  async search(term: string, companyId?: string): Promise<DataSubjectDto[]> {
    try {
      if (!term || term.trim() === '') {
        throw new BadRequestException({
          code: ErrorCode.INVALID_INPUT,
          message: 'El término de búsqueda es requerido'
        });
      }

      // Construir una consulta que busque en múltiples campos
      let query = this.supabase
        .from('data_subject')
        .select('*')
        .or(`email.ilike.%${term}%,full_name.ilike.%${term}%,external_id.eq.${term},phone.ilike.%${term}%,id.eq.${term}`);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error en búsqueda general: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error en búsqueda general de titulares',
          originalError: error
        });
      }

      return safeArrayMap(data as DataSubjectEntity[], item => this.transformToDto(item));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error en búsqueda general: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado en búsqueda general',
        originalError: error
      });
    }
  }
  
  /**
   * Cuenta titulares de datos según criterios
   * @param companyId - ID de la compañía (opcional)
   * @param status - Estado para filtrar (opcional)
   * @returns Número total de titulares que cumplen los criterios
   */
  async count(companyId?: string, status?: DataSubjectStatus): Promise<number> {
    try {
      let query = this.supabase
        .from('data_subject')
        .select('*', { count: 'exact', head: true });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const countResult = await query;
      // Usar operador de coalescencia para manejar count posiblemente nulo
      const count = countResult?.count ?? 0;

      if (countResult.error) {
        this.logger.error(`Error al contar titulares: ${countResult.error.message}`, countResult.error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al contar titulares de datos',
          originalError: countResult.error
        });
      }

      return count;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al contar titulares: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al contar titulares',
        originalError: error
      });
    }
  }

  /**
   * Actualiza el estado de verificación de un titular de datos
   * @param id - ID del titular de datos
   * @param verified - Nuevo estado de verificación
   * @param userId - ID del usuario que realiza la actualización
   * @returns Titular de datos actualizado
   */
  async updateVerificationStatus(id: string, verified: boolean, userId: string): Promise<DataSubjectDto> {
    try {
      // Verificar que el titular existe
      const dataSubject = await this.findOne(id);
      
      // Actualizar solo el estado de verificación
      const { data, error } = await this.supabase
        .from('data_subject')
        .update({
          verified,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error al actualizar estado de verificación: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al actualizar estado de verificación',
          originalError: error
        });
      }

      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE,
        resourceType: ResourceType.USER,
        resourceId: id,
        userId,
        metadata: {
          field: 'verified',
          newValue: verified,
          previousValue: dataSubject.verified,
        },
      });

      return this.transformToDto(data as DataSubjectEntity);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al actualizar estado de verificación: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al actualizar estado de verificación',
        originalError: error
      });
    }
  }

  /**
   * Valida la existencia de un titular de datos
   * @param id - ID del titular de datos a validar
   * @returns true si el titular existe, false en caso contrario
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('data_subject')
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        this.logger.error(`Error al verificar existencia: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al verificar existencia del titular',
          originalError: error
        });
      }

      return !!count && count > 0;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al verificar existencia: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al verificar existencia',
        originalError: error
      });
    }
  }

  /**
   * Encuentra un titular de datos por su ID
   * @param id - ID del titular de datos
   * @returns Titular de datos encontrado
   */
  async findOne(id: string): Promise<DataSubjectDto> {
    try {
      const { data, error } = await this.supabase
        .from('data_subject')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error(`Error al buscar titular de datos: ${error.message}`, error);
        throw new NotFoundException({
          code: ErrorCode.DATA_SUBJECT_NOT_FOUND,
          message: `Titular de datos con ID ${id} no encontrado`,
          originalError: error
        });
      }

      return this.transformToDto(data as DataSubjectEntity);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al buscar titular de datos: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `Error al buscar titular de datos con ID ${id}`,
        originalError: error
      });
    }
  }

  /**
   * Encuentra un titular de datos por su email
   * @param email - Email del titular de datos
   * @param companyId - ID de la compañía para filtrar (opcional)
   * @returns Titular de datos encontrado
   */
  async findByEmail(email: string, companyId?: string): Promise<DataSubjectDto> {
    try {
      let query = this.supabase
        .from('data_subject')
        .select('*')
        .eq('email', email);

      // Si se proporciona companyId, filtrar por esa empresa
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.single();

      if (error) {
        this.logger.error(`Error al buscar titular de datos por email: ${error.message}`, error);
        throw new NotFoundException({
          code: ErrorCode.DATA_SUBJECT_NOT_FOUND,
          message: `Titular de datos con email ${email} no encontrado`,
          originalError: error
        });
      }

      return this.transformToDto(data as DataSubjectEntity);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al buscar titular de datos por email: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `Error al buscar titular de datos con email ${email}`,
        originalError: error
      });
    }
  }

  /**
   * Actualiza un titular de datos
   * @param id - ID del titular de datos
   * @param updateDataSubjectDto - Datos para actualizar
   * @param userId - ID del usuario que realiza la actualización (opcional)
   * @returns Titular de datos actualizado
   */
  async update(id: string, updateDataSubjectDto: UpdateDataSubjectDto, userId?: string): Promise<DataSubjectDto> {
    try {
      // Obtener el titular actual para auditoría
      const dataSubject = await this.findOne(id);

      const now = new Date().toISOString();

      // Actualizar los datos
      const { data, error } = await this.supabase
        .from('data_subject')
        .update({
          ...updateDataSubjectDto,
          updated_at: now
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error al actualizar titular de datos: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al actualizar titular de datos',
          originalError: error
        });
      }

      // Registrar en auditoría
      if (userId) {
        await this.auditService.log({
          action: AuditAction.UPDATE,
          resourceType: ResourceType.USER,
          resourceId: id,
          userId,
          metadata: {
            email: data.email,
            name: data.full_name,
            previousStatus: dataSubject.status,
            newStatus: data.status,
            changedFields: Object.keys(updateDataSubjectDto)
          },
        });
      }

      return this.transformToDto(data as DataSubjectEntity);
    } catch (error) {
      if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar titular de datos: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `Error al actualizar titular de datos con ID ${id}`,
        originalError: error
      });
    }
  }

  /**
   * Elimina un titular de datos (cambio de estado a DELETED)
   * @param id - ID del titular de datos
   * @param userId - ID del usuario que realiza la eliminación (opcional)
   */
  async remove(id: string, userId?: string): Promise<void> {
    try {
      // Obtener el titular actual para auditoría
      const dataSubject = await this.findOne(id);

      const now = new Date().toISOString();

      // Actualizar a estado DELETED
      const { error } = await this.supabase
        .from('data_subject')
        .update({
          status: DataSubjectStatus.DELETED,
          updated_at: now
        })
        .eq('id', id);

      if (error) {
        this.logger.error(`Error al eliminar titular de datos: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al cambiar el estado del titular de datos a eliminado',
          originalError: error
        });
      }

      // Revocar todos los consentimientos asociados
      const { error: consentError } = await this.supabase
        .from('consent')
        .update({
          status: ConsentStatus.REVOKED,
          updated_at: now
        })
        .eq('data_subject_id', id);

      if (consentError) {
        this.logger.warn(
          `Error al revocar consentimientos del titular: ${consentError.message}`, 
          consentError
        );
        // No lanzamos error para no interrumpir la operación principal
      }

      // Registrar en auditoría
      if (userId) {
        await this.auditService.log({
          action: AuditAction.DELETE,
          resourceType: ResourceType.USER,
          resourceId: id,
          userId,
          metadata: {
            email: dataSubject.email,
            name: dataSubject.fullName,
            previousStatus: dataSubject.status,
            timestamp: now
          },
        });
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar titular de datos: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: `Error al eliminar titular de datos con ID ${id}`,
        originalError: error
      });
    }
  }

  /**
   * Solicita acceso al portal de autogestión
   * @param portalAccessRequestDto - Datos para solicitar acceso
   * @returns Objeto con mensaje de confirmación
   */
  async requestPortalAccess(portalAccessRequestDto: PortalAccessRequestDto): Promise<{ message: string }> {
    try {
      const { email, frontendPortalUrl } = portalAccessRequestDto;
      
      // Buscar el titular de datos por email
      const dataSubject = await this.findByEmail(email);
      
      // Generar un token para acceso al portal
      const token = crypto.randomBytes(32).toString('hex');
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24); // Token válido por 24 horas
      
      // Actualizar el titular con el token
      const { error } = await this.supabase
        .from('data_subject')
        .update({
          portal_access_token: token,
          portal_access_token_expiry: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', dataSubject.id);
      
      if (error) {
        this.logger.error(`Error al generar token de acceso: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al generar token de acceso al portal',
          originalError: error
        });
      }
      
      // Obtener datos de la empresa si el titular está asociado a una
      let companyName: string | undefined = undefined;
      if (dataSubject.companyId) {
        const { data: company, error: companyError } = await this.supabase
          .from('company')
          .select('name')
          .eq('id', dataSubject.companyId)
          .single();
        
        if (!companyError && company) {
          companyName = company.name;
        }
      }
      
      // Construir el enlace para el portal
      const baseUrl = frontendPortalUrl || this.configService.get<string>('FRONTEND_URL') || 'https://app.consentia.io';
      const portalLink = `${baseUrl}/portal/verify?token=${token}`;
      
      // Enviar correo electrónico con el enlace
      const emailResult = await this.emailService.sendPortalAccessEmail({
        email: dataSubject.email,
        name: dataSubject.fullName || 'Estimado usuario',
        portalLink,
        expirationHours: 24,
        companyName,
      });
      
      if (!emailResult.success) {
        this.logger.warn(`Error al enviar correo de acceso al portal: ${emailResult.error?.message}`, emailResult.error);
        // No lanzamos error para no interrumpir el flujo principal
      } else {
        this.logger.log(`Correo de acceso al portal enviado correctamente a ${dataSubject.email}`);
      }
      
      return { message: 'Se ha enviado un enlace de acceso a su correo electrónico' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al solicitar acceso al portal: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error al procesar solicitud de acceso al portal',
        originalError: error
      });
    }
  }

  /**
   * Verifica token de acceso al portal y retorna el ID del titular
   * @param portalVerificationDto - Datos para verificar el token
   * @returns ID del titular de datos
   */
  async verifyPortalAccess(portalVerificationDto: PortalVerificationDto): Promise<{ dataSubjectId: string }> {
    try {
      const { token } = portalVerificationDto;
      
      // Buscar el titular por el token
      const { data, error } = await this.supabase
        .from('data_subject')
        .select('*')
        .eq('portal_access_token', token)
        .single();
      
      if (error || !data) {
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_TOKEN,
          message: 'Token de acceso inválido',
          originalError: error
        });
      }
      
      const now = new Date();
      const tokenExpiry = new Date(data.portal_access_token_expiry);
      
      if (now > tokenExpiry) {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Token de acceso expirado',
          originalError: { tokenExpiry }
        });
      }
      
      // Actualizar último acceso al portal
      const { error: updateError } = await this.supabase
        .from('data_subject')
        .update({
          last_portal_access: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', data.id);
      
      if (updateError) {
        this.logger.warn(`Error al actualizar último acceso al portal: ${updateError.message}`, updateError);
        // No lanzamos error para no interrumpir la verificación
      }
      
      return { dataSubjectId: data.id };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error al verificar token de acceso: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error al verificar token de acceso al portal',
        originalError: error
      });
    }
  }

  /**
   * Obtiene el historial de consentimientos de un titular de datos
   * @param dataSubjectId - ID del titular de datos
   * @returns Historial de consentimientos
   */
  async getConsentHistory(dataSubjectId: string): Promise<ConsentHistoryDto[]> {
    try {
      // Verificar que el titular existe
      await this.findOne(dataSubjectId);
      
      // Obtener consentimientos con detalles de políticas y tipos de datos
      const { data, error } = await this.supabase
        .from('consent')
        .select(`
          id,
          status,
          reason,
          created_at,
          updated_at,
          expires_at,
          metadata,
          legal_policy:legal_policy_id (
            id, 
            title, 
            version,
            valid_from,
            status,
            content
          ),
          consent_request (
            purpose,
            channel,
            metadata
          ),
          consent_data_type (
            data_type_id,
            data_type:data_type_id (id, name, code, description)
          )
        `)
        .eq('data_subject_id', dataSubjectId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        this.logger.error(`Error al obtener historial de consentimientos: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al obtener historial de consentimientos',
          originalError: error
        });
      }
      
      // Transformar los datos a DTOs
      return safeArrayMap(data as ConsentEntity[], consent => {
        const now = new Date();
        const expiryDate = consent.expires_at ? new Date(consent.expires_at) : null;
        
        // Procesamos legal_policy de forma segura
        const legalPolicy = handleNestedProperty(consent.legal_policy);
        const consentRequest = handleNestedProperty(consent.consent_request);
        
        // Obtener la fecha correcta de la acción
        let actionDate = consent.updated_at;
        const metadata = safeMetadata(consent.metadata);
        
        // Si el consentimiento fue revocado, usar la fecha de revocación
        if (consent.status === ConsentStatus.REVOKED && metadata.revoked_at) {
          actionDate = metadata.revoked_at;
        }
        
        // Extraer el propósito del consentimiento
        const purpose = consentRequest?.purpose || 
          (consentRequest?.metadata?.purpose) || 
          metadata?.purpose || 
          '';
          
        // Obtener detalles más específicos según el estado
        let statusDetails = '';
        if (consent.status === ConsentStatus.DENIED || consent.status === ConsentStatus.REVOKED) {
          statusDetails = consent.reason || '';
        }

        // Verificar si el consentimiento ha expirado aunque no esté marcado como tal
        let status = consent.status as ConsentStatus;
        let isExpired = expiryDate ? now > expiryDate : false;
        
        // Si está expirado pero no está marcado como tal, lo consideramos expirado para UI
        if (isExpired && status !== ConsentStatus.EXPIRED) {
          status = ConsentStatus.EXPIRED;
        }
        
        return {
          id: consent.id,
          dataSubjectId,
          legalPolicyId: safeValue(legalPolicy, 'id', ''),
          policyTitle: safeValue(legalPolicy, 'title', ''),
          policyVersion: safeValue(legalPolicy, 'version', ''),
          policyDate: safeValue(legalPolicy, 'valid_from', ''),
          purpose,
          status,
          statusDetails,
          dataTypes: safeArrayMap(consent.consent_data_type, cdt => {
            const dataType = handleNestedProperty(cdt.data_type);
            return {
              id: safeValue(dataType, 'id', ''),
              name: safeValue(dataType, 'name', ''),
              code: safeValue(dataType, 'code', '')
            };
          }),
          actionDate: actionDate || consent.created_at || new Date().toISOString(),
          expiryDate: consent.expires_at || undefined,
          isExpired,
          channel: consentRequest?.channel || metadata?.channel || ''
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al obtener historial de consentimientos: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error inesperado al obtener historial de consentimientos',
        originalError: error
      });
    }
  }

  /**
   * Obtiene las preferencias de consentimiento actuales del titular de datos
   * @param dataSubjectId - ID del titular de datos
   * @returns Preferencias de consentimiento
   */
  async getConsentPreferences(dataSubjectId: string): Promise<ConsentPreferencesDto> {
    try {
      // Obtener el titular de datos
      const dataSubject = await this.findOne(dataSubjectId);
      
      // Obtener consentimientos activos
      const { data, error } = await this.supabase
        .from('consent')
        .select(`
          id,
          status,
          updated_at,
          expiry_date,
          is_mandatory,
          legal_policy:legal_policy_id (id, title, description),
          consent_data_type (
            data_type_id,
            data_type:data_type_id (id, name, code, description)
          )
        `)
        .eq('data_subject_id', dataSubjectId)
        .neq('status', 'revoked')
        .neq('status', 'expired')
        .order('updated_at', { ascending: false });
      
      if (error) {
        this.logger.error(`Error al obtener preferencias de consentimiento: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al obtener preferencias de consentimiento',
          originalError: error
        });
      }
      
      // Transformar a DTO
      const preferences = safeArrayMap(data as ConsentEntity[], consent => {
        // Procesamos legal_policy de forma segura
        const legalPolicy = handleNestedProperty(consent.legal_policy);
        // Garantizar que la descripción de la política siempre sea un string
        const policyDescription = legalPolicy?.description ?? '';
        
        return {
          id: consent.id,
          legalPolicyId: safeValue(legalPolicy, 'id', ''),
          policyTitle: safeValue(legalPolicy, 'title', ''),
          policyDescription, // Ahora es seguro que siempre es un string
          status: consent.status as ConsentStatus,
          lastUpdated: consent.updated_at || new Date().toISOString(),
          isMandatory: Boolean(consent.is_mandatory),
          expiryDate: consent.expiry_date || undefined,
          dataTypes: safeArrayMap(consent.consent_data_type, cdt => {
            const dataType = handleNestedProperty(cdt.data_type);
            return {
              id: safeValue(dataType, 'id', ''),
              name: safeValue(dataType, 'name', ''),
              code: safeValue(dataType, 'code', ''),
              description: safeValue(dataType, 'description', '')
            };
          })
        };
      });
      
      return {
        dataSubjectId,
        email: dataSubject.email,
        preferences,
        lastUpdated: (data && data.length > 0) ? data[0].updated_at || dataSubject.updatedAt : dataSubject.updatedAt
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al obtener preferencias de consentimiento: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Procesa una solicitud de eliminación de datos
   * @param dataSubjectId - ID del titular de datos
   * @param dataDeletionRequestDto - Datos de la solicitud de eliminación
   * @returns Mensaje de confirmación
   */
  async requestDataDeletion(
    dataSubjectId: string,
    dataDeletionRequestDto: DataDeletionRequestDto
  ): Promise<{ message: string; requestId: string }> {
    try {
      // Verificar que el titular existe
      const dataSubject = await this.findOne(dataSubjectId);
      
      const now = new Date().toISOString();
      
      // Crear un registro de la solicitud
      const { data, error } = await this.supabase
        .from('data_subject_request')
        .insert({
          data_subject_id: dataSubjectId,
          type: 'deletion',
          status: 'pending',
          reason: dataDeletionRequestDto.reason,
          metadata: {
            isComplete: dataDeletionRequestDto.isComplete,
            dataTypeIds: dataDeletionRequestDto.dataTypeIds || []
          },
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (error) {
        this.logger.error(`Error al crear solicitud de eliminación: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al crear solicitud de eliminación de datos',
          originalError: error
        });
      }
      
      // Si es una eliminación completa, marcar el estado del titular como DELETED
      if (dataDeletionRequestDto.isComplete) {
        const { error: updateError } = await this.supabase
          .from('data_subject')
          .update({
            status: DataSubjectStatus.DELETED,
            updated_at: now
          })
          .eq('id', dataSubjectId);
        
        if (updateError) {
          this.logger.error(`Error al actualizar estado del titular: ${updateError.message}`, updateError);
          throw new InternalServerErrorException({
            code: ErrorCode.DATABASE_ERROR,
            message: 'Error al actualizar estado del titular de datos',
            originalError: updateError
          });
        }
        
        // Revocar todos los consentimientos
        const { error: consentError } = await this.supabase
          .from('consent')
          .update({
            status: ConsentStatus.REVOKED,
            updated_at: now
          })
          .eq('data_subject_id', dataSubjectId);
        
        if (consentError) {
          this.logger.warn(`Error al revocar consentimientos: ${consentError.message}`, consentError);
          // No lanzamos excepción aquí para no interrumpir el proceso principal
        }
      }
      
      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.DELETE,
        resourceType: ResourceType.USER,
        resourceId: dataSubjectId,
        userId: dataSubjectId, // El propio titular solicita la eliminación
        metadata: {
          requestId: data.id,
          email: dataSubject.email,
          name: dataSubject.fullName,
          isComplete: dataDeletionRequestDto.isComplete,
          reason: dataDeletionRequestDto.reason,
          dataTypeIds: dataDeletionRequestDto.dataTypeIds
        },
      });
      
      return {
        message: 'Solicitud de eliminación procesada correctamente',
        requestId: data.id
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al procesar solicitud de eliminación: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error al procesar solicitud de eliminación de datos',
        originalError: error
      });
    }
  }

  /**
   * Procesa una solicitud de acceso a datos personales
   * @param dataSubjectId - ID del titular de datos
   * @param dataAccessRequestDto - Datos de la solicitud de acceso
   * @returns Respuesta con los datos solicitados
   */
  async requestDataAccess(
    dataSubjectId: string,
    dataAccessRequestDto: DataAccessRequestDto
  ): Promise<DataAccessResponseDto> {
    try {
      // Verificar que el titular existe
      const dataSubject = await this.findOne(dataSubjectId);
      
      const now = new Date().toISOString();
      
      // Crear un registro de la solicitud
      const { data: requestData, error: requestError } = await this.supabase
        .from('data_subject_request')
        .insert({
          data_subject_id: dataSubjectId,
          type: 'access',
          status: 'processing',
          reason: dataAccessRequestDto.reason,
          metadata: {
            dataTypeIds: dataAccessRequestDto.dataTypeIds || []
          },
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (requestError) {
        this.logger.error(`Error al crear solicitud de acceso: ${requestError.message}`, requestError);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al crear solicitud de acceso a datos',
          originalError: requestError
        });
      }
      
      // Obtener los datos del titular
      let dataTypeQuery = this.supabase
        .from('data_type')
        .select('*');
      
      if (dataAccessRequestDto.dataTypeIds && dataAccessRequestDto.dataTypeIds.length > 0) {
        dataTypeQuery = dataTypeQuery.in('id', dataAccessRequestDto.dataTypeIds);
      }
      
      const { data: dataTypes, error: dataTypesError } = await dataTypeQuery;
      
      if (dataTypesError) {
        this.logger.error(`Error al obtener tipos de datos: ${dataTypesError.message}`, dataTypesError);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al obtener tipos de datos',
          originalError: dataTypesError
        });
      }
      
      // Organizar los datos por categoría utilizando utilidades
      const typesByCategory = this.organizeDataTypesByCategory(dataTypes as DataTypeEntity[]);
      
      // Construir la respuesta con los datos personales organizados por categoría
      const personalData = Object.entries(typesByCategory).map(([category, types]) => {
        return {
          category,
          data: safeArrayMap(types, type => {
            // Usar nuestra función de utilidad para obtener el valor del dato personal
            const value = this.getPersonalDataValue(dataSubject, type.code);
            
            return {
              dataType: type.name,
              dataTypeCode: type.code,
              value,
              lastUpdated: dataSubject.updatedAt
            };
          })
        };
      });
      
      // Generar un enlace de descarga que expira en 7 días
      const downloadExpiry = new Date();
      downloadExpiry.setDate(downloadExpiry.getDate() + 7);
      
      // Marcar la solicitud como completada
      await this.supabase
        .from('data_subject_request')
        .update({
          status: 'completed',
          updated_at: now
        })
        .eq('id', requestData.id);
      
      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.READ,
        resourceType: ResourceType.USER,
        resourceId: dataSubjectId,
        userId: dataSubjectId, // El propio titular solicita el acceso
        metadata: {
          requestId: requestData.id,
          email: dataSubject.email,
          name: dataSubject.fullName,
          dataTypeIds: dataAccessRequestDto.dataTypeIds || 'all'
        },
      });
      
      const downloadLink = `https://api.consentia.com/download/${requestData.id}`; // Esto es un ejemplo, debe implementarse
      
      return {
        requestId: requestData.id,
        dataSubjectId,
        requestDate: requestData.created_at,
        processedDate: now,
        status: DataRequestStatus.COMPLETED,
        personalData,
        downloadLink,
        downloadLinkExpiry: downloadExpiry.toISOString()
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Error al procesar solicitud de acceso: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error al procesar solicitud de acceso a datos',
        originalError: error
      });
    }
  }

  /**
   * Organiza los tipos de datos por categoría
   * @param dataTypes - Tipos de datos a organizar
   * @returns Objeto con los tipos de datos organizados por categoría
   * @private
   */
  private organizeDataTypesByCategory(dataTypes: DataTypeEntity[]): Record<string, DataTypeEntity[]> {
    return safeArrayMap(dataTypes, type => type).reduce((acc: Record<string, DataTypeEntity[]>, type) => {
      const category = type.category || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(type);
      return acc;
    }, {});
  }

  /**
   * Procesa una solicitud de rectificación de datos
   * @param dataSubjectId - ID del titular de datos
   * @param dataRectificationRequestDto - Datos de la solicitud de rectificación
   * @returns Mensaje de confirmación
   */
  async requestDataRectification(
    dataSubjectId: string,
    dataRectificationRequestDto: DataRectificationRequestDto
  ): Promise<{ message: string; requestId: string }> {
    try {
      // Verificar que el titular existe
      const dataSubject = await this.findOne(dataSubjectId);
      
      const now = new Date().toISOString();
      
      // Crear un registro de la solicitud
      const { data, error } = await this.supabase
        .from('data_subject_request')
        .insert({
          data_subject_id: dataSubjectId,
          type: 'rectification',
          status: 'pending',
          reason: dataRectificationRequestDto.reason,
          metadata: {
            items: dataRectificationRequestDto.items
          },
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (error) {
        this.logger.error(`Error al crear solicitud de rectificación: ${error.message}`, error);
        throw new InternalServerErrorException({
          code: ErrorCode.DATABASE_ERROR,
          message: 'Error al crear solicitud de rectificación de datos',
          originalError: error
        });
      }
      
      // En el caso de algunos tipos de datos básicos, aplicar la rectificación directamente
      const updateData = {};
      let metadataUpdate = false;
      const metadata = safeMetadata(dataSubject.metadata);
      
      for (const item of dataRectificationRequestDto.items) {
        try {
          // Obtener el tipo de dato
          const { data: dataType, error: dataTypeError } = await this.supabase
            .from('data_type')
            .select('code')
            .eq('id', item.dataTypeId)
            .single();
          
          if (dataTypeError) {
            this.logger.warn(`Error al obtener tipo de dato ${item.dataTypeId}: ${dataTypeError.message}`, dataTypeError);
            continue;
          }
          
          if (!dataType) continue;
          
          // Actualizar según el código del tipo de dato
          if (dataType.code === 'EMAIL') {
            updateData['email'] = item.newValue;
          } else if (dataType.code === 'PHONE') {
            updateData['phone'] = item.newValue;
          } else if (dataType.code === 'FULL_NAME') {
            updateData['full_name'] = item.newValue;
          } else {
            // Para otros tipos, actualizar en metadata
            metadata[dataType.code.toLowerCase()] = item.newValue;
            metadataUpdate = true;
          }
        } catch (itemError) {
          this.logger.warn(`Error al procesar ítem de rectificación ${item.dataTypeId}: ${itemError.message}`, itemError);
          // Continuamos con el siguiente ítem, no interrumpimos el proceso
        }
      }
      
      if (metadataUpdate) {
        updateData['metadata'] = metadata;
      }
      
      if (Object.keys(updateData).length > 0) {
        // Aplicar actualizaciones al titular de datos
        const { error: updateError } = await this.supabase
          .from('data_subject')
          .update({
            ...updateData,
            updated_at: now
          })
          .eq('id', dataSubjectId);
        
        if (updateError) {
          this.logger.error(`Error al actualizar datos del titular: ${updateError.message}`, updateError);
          throw new InternalServerErrorException({
            code: ErrorCode.DATABASE_ERROR,
            message: 'Error al actualizar datos del titular',
            originalError: updateError
          });
        }
        
        // Marcar la solicitud como completada si se aplicaron cambios
        await this.supabase
          .from('data_subject_request')
          .update({
            status: 'completed',
            updated_at: now
          })
          .eq('id', data.id);
      }
      
      // Registrar en auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE,
        resourceType: ResourceType.USER,
        resourceId: dataSubjectId,
        userId: dataSubjectId, // El propio titular solicita la rectificación
        metadata: {
          requestId: data.id,
          email: dataSubject.email,
          name: dataSubject.fullName,
          items: dataRectificationRequestDto.items,
          changedFields: Object.keys(updateData)
        },
      });
      
      return {
        message: 'Solicitud de rectificación procesada correctamente',
        requestId: data.id
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al procesar solicitud de rectificación: ${error.message}`, error);
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Error al procesar solicitud de rectificación de datos',
        originalError: error
      });
    }
  }

  /**
   * Transforma un objeto de la base de datos a DTO
   * @param data - Datos de la base de datos
   * @returns Objeto DTO
   * @private
   */
  private transformToDto(data: DataSubjectEntity): DataSubjectDto {
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      externalId: data.external_id,
      companyId: data.company_id,
      status: data.status as DataSubjectStatus,
      verified: data.verified ?? false,
      verificationToken: data.verification_token,
      verificationTokenExpiry: data.verification_token_expiry,
      portalAccessToken: data.portal_access_token,
      portalAccessTokenExpiry: data.portal_access_token_expiry,
      metadata: safeMetadata(data.metadata),
      lastPortalAccess: data.last_portal_access,
      createdAt: data.created_at ?? new Date().toISOString(),
      updatedAt: data.updated_at ?? new Date().toISOString()
    };
  }

  private getPersonalDataValue(dataSubject: DataSubjectDto, typeCode: string): any {
    // Basic personal data
    if (typeCode === 'EMAIL') {
      return dataSubject.email;
    }
    if (typeCode === 'PHONE') {
      return dataSubject.phone;
    }
    if (typeCode === 'FULL_NAME') {
      return dataSubject.fullName;
    }
    
    // Look in metadata for additional data
    const metadata = dataSubject.metadata ? { ...dataSubject.metadata } : {};
    
    // Try lowercase, uppercase and original format
    if (metadata[typeCode.toLowerCase()]) {
      return metadata[typeCode.toLowerCase()];
    }
    if (metadata[typeCode.toUpperCase()]) {
      return metadata[typeCode.toUpperCase()];
    }
    if (metadata[typeCode]) {
      return metadata[typeCode];
    }
    
    return null;
  }
}
