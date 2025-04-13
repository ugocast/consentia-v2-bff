import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  GoneException,
} from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  AuditService,
  AuditAction,
  ResourceType,
} from '../common/audit/audit.service';
import {
  CreateConsentRequestDto,
  RespondConsentRequestDto,
  UpdateConsentStatusDto,
  ConsentDto,
  ConsentRequestDto,
  ConsentWithDetailsDto,
  ConsentStatus,
  ConsentHistoryDto,
} from './dto';
import { ErrorCode } from '../common/enums/error-code.enum';
import { ConsentEntity } from '../common/interfaces/supabase-responses.interface';
import { handleNestedProperty, safeArrayMap, safeMetadata, safeValue } from '../common/utils/data-transforms.util';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { EmailService } from '../common/services/email/email.service';

@Injectable()
export class ConsentsService {
  private readonly logger = new Logger(ConsentsService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Obtiene todos los consentimientos con filtros opcionales
   * @param companyId - ID de la compañía para filtrar consentimientos (opcional)
   * @param dataSubjectId - ID del titular de los datos para filtrar consentimientos (opcional)
   * @param status - Estado para filtrar consentimientos (opcional)
   * @returns Lista de consentimientos que cumplen con los criterios de filtrado
   * @throws Error si hay un problema al obtener los consentimientos
   */
  async findAll(
    companyId?: string,
    dataSubjectId?: string,
    status?: ConsentStatus,
  ): Promise<ConsentDto[]> {
    try {
      let query = this.supabase.from('consent').select('*');

      // Aplicar filtros si se proporcionan
      if (companyId) {
        // Para filtrar por compañía, necesitamos unir con la tabla legal_policy
        query = this.supabase
          .from('consent')
          .select('*, legal_policy!inner(*)')
          .eq('legal_policy.company_id', companyId);
      }

      if (dataSubjectId) {
        query = query.eq('data_subject_id', dataSubjectId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error(
          `Error al obtener consentimientos: ${error.message}`,
          error,
        );
        throw new Error(`Error al obtener consentimientos: ${error.message}`);
      }

      // Transformar los datos al formato esperado
      return data.map((item) => {
        // Si filtramos por compañía, extraemos la política legal pero no la necesitamos en la respuesta
        const { legal_policy: _legalPolicy, ...consent } = item;
        
        // Transformar el consentimiento a camelCase
        return {
          id: consent.id,
          dataSubjectId: consent.data_subject_id,
          legalPolicyId: consent.legal_policy_id,
          consentRequestId: consent.consent_request_id,
          status: consent.status,
          reason: consent.reason,
          metadata: consent.metadata,
          createdAt: consent.created_at,
          updatedAt: consent.updated_at,
          expiresAt: consent.expires_at,
        };
      });
    } catch (error) {
      this.logger.error('Error al obtener consentimientos', error);
      throw error;
    }
  }

  /**
   * Obtiene un consentimiento por su ID con detalles adicionales
   * @param id - ID único del consentimiento a buscar
   * @returns Consentimiento con detalles adicionales como política legal y tipos de datos
   * @throws NotFoundException si el consentimiento no existe
   * @throws Error si hay un problema al obtener el consentimiento
   */
  async findOne(id: string): Promise<ConsentWithDetailsDto> {
    try {
      // Obtener el consentimiento con la política legal y los tipos de datos
      const { data, error } = await this.supabase
        .from('consent')
        .select(
          `
          *,
          legal_policy (*),
          data_subject:data_subject_id (*),
          consent_data_type (
            data_type_id,
            data_type:data_type_id (*)
          )
        `,
        )
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logger.error(`Consentimiento no encontrado: ${error?.message}`);
        throw new NotFoundException('Consentimiento no encontrado');
      }

      // Transformar los datos al formato esperado
      const { consent_data_type, legal_policy, data_subject, ...consentData } = data;
      
      // Transformar los tipos de datos
      const dataTypes = consent_data_type?.map((item) => ({
        id: item.data_type.id,
        name: item.data_type.name,
        description: item.data_type.description,
      })) || [];

      // Crear un objeto DTO para legalPolicy con todas las propiedades correctamente mapeadas
      const legalPolicyDto = legal_policy ? {
        id: legal_policy.id,
        title: legal_policy.title || '',
        content: legal_policy.content || '',
        version: legal_policy.version,
        validFrom: legal_policy.valid_from || '',
        validTo: legal_policy.valid_to || null,
        dataTypes: legal_policy.data_types || [],
        status: legal_policy.status,
        metadata: legal_policy.metadata || {},
        companyId: legal_policy.company_id,
        createdAt: legal_policy.created_at || '',
        updatedAt: legal_policy.updated_at || '',
      } : undefined;

      // Transformar el consentimiento
      return {
        id: consentData.id,
        dataSubject: {
          id: consentData.data_subject_id,
          email: data_subject?.email || '',
          name: data_subject?.name || '',
        },
        legalPolicy: legalPolicyDto ? {
          ...legalPolicyDto
        } : {
          id: consentData.legal_policy_id,
          title: '',
          content: '',
        },
        status: consentData.status,
        purpose: consentData.purpose || '',
        channel: consentData.channel || '',
        metadata: consentData.metadata || {},
        createdAt: consentData.created_at,
        updatedAt: consentData.updated_at,
        expiresAt: consentData.expires_at,
        dataTypes,
        companyId: consentData.company_id,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener consentimiento: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Actualiza el estado de un consentimiento
   * @param id - ID único del consentimiento a actualizar
   * @param updateStatusDto - DTO con el nuevo estado y metadatos adicionales
   * @param userId - ID del usuario que realiza la actualización
   * @returns Consentimiento actualizado con el nuevo estado
   * @throws NotFoundException si el consentimiento no existe
   * @throws BadRequestException si la transición de estado no es válida
   * @throws Error si hay un problema al actualizar el consentimiento
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateConsentStatusDto,
    userId: string,
  ): Promise<ConsentDto> {
    try {
      // Obtener el consentimiento actual
      const { data: currentConsent, error: fetchError } = await this.supabase
        .from('consent')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentConsent) {
        this.logger.error(
          `Consentimiento no encontrado: ${fetchError?.message}`,
        );
        throw new NotFoundException('Consentimiento no encontrado');
      }

      // Validar la transición de estado
      this.validateStatusTransition(
        currentConsent.status,
        updateStatusDto.status,
      );

      // Actualizar el estado del consentimiento
      const { data: updatedConsent, error: updateError } = await this.supabase
        .from('consent')
        .update({
          status: updateStatusDto.status,
          reason: updateStatusDto.reason,
          metadata: {
            ...currentConsent.metadata,
            ...updateStatusDto.metadata,
            status_updated_at: new Date().toISOString(),
          },
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        this.logger.error(
          `Error al actualizar estado: ${updateError.message}`,
          updateError,
        );
        throw new Error(`Error al actualizar estado: ${updateError.message}`);
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE_CONSENT,
        resourceType: ResourceType.CONSENT,
        resourceId: id,
        userId,
        metadata: {
          previousStatus: currentConsent.status,
          newStatus: updateStatusDto.status,
          reason: updateStatusDto.reason,
        },
      });

      // Transformar el consentimiento a camelCase
      return {
        id: updatedConsent.id,
        dataSubjectId: updatedConsent.data_subject_id,
        legalPolicyId: updatedConsent.legal_policy_id,
        consentRequestId: updatedConsent.consent_request_id,
        status: updatedConsent.status,
        reason: updatedConsent.reason,
        metadata: updatedConsent.metadata,
        createdAt: updatedConsent.created_at,
        updatedAt: updatedConsent.updated_at,
        expiresAt: updatedConsent.expires_at,
      };
    } catch (error) {
      this.logger.error(`Error al actualizar estado: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva solicitud de consentimiento
   * @param createRequestDto - DTO con los datos para crear la solicitud
   * @param companyId - ID de la compañía que crea la solicitud
   * @param userId - ID del usuario que crea la solicitud
   * @returns La solicitud de consentimiento creada
   * @throws BadRequestException si hay un problema con los datos de la solicitud
   * @throws Error si hay un error al crear la solicitud
   */
  async createRequest(
    createRequestDto: CreateConsentRequestDto,
    companyId: string,
    userId: string,
  ): Promise<ConsentRequestDto> {
    try {
      // Validar que la política legal pertenece a la compañía
      const { data: legalPolicy, error: policyError } = await this.supabase
        .from('legal_policy')
        .select('*')
        .eq('id', createRequestDto.legalPolicyId)
        .eq('company_id', companyId)
        .single();

      if (policyError || !legalPolicy) {
        this.logger.error(
          `Política legal no encontrada o no pertenece a la compañía: ${policyError?.message}`,
        );
        throw new BadRequestException(
          'Política legal no encontrada o no pertenece a la compañía',
        );
      }

      // Validar que el titular de datos existe
      const { data: dataSubject, error: subjectError } = await this.supabase
        .from('data_subject')
        .select('*')
        .eq('id', createRequestDto.dataSubjectId)
        .single();

      if (subjectError || !dataSubject) {
        this.logger.error(
          `Titular de datos no encontrado: ${subjectError?.message}`,
        );
        throw new BadRequestException('Titular de datos no encontrado');
      }

      // Obtener información de la empresa
      const { data: company, error: companyError } = await this.supabase
        .from('company')
        .select('name')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        this.logger.error(
          `Empresa no encontrada: ${companyError?.message}`,
        );
        throw new BadRequestException('Empresa no encontrada');
      }

      // Generar un token único para la solicitud
      const token = this.generateUniqueToken();
      
      // Calcular la fecha de expiración (por defecto 7 días)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Crear la solicitud de consentimiento
      const { data: request, error: createError } = await this.supabase
        .from('consent_request')
        .insert({
          data_subject_id: createRequestDto.dataSubjectId,
          legal_policy_id: createRequestDto.legalPolicyId,
          company_id: companyId,
          status: 'PENDING',
          purpose: createRequestDto.purpose,
          channel: createRequestDto.channel,
          token: token,
          expires_at: expiresAt.toISOString(),
          metadata: {
            ...createRequestDto.metadata,
            created_by: userId,
          },
        })
        .select()
        .single();

      if (createError) {
        this.logger.error(
          `Error al crear solicitud: ${createError.message}`,
          createError,
        );
        throw new Error(`Error al crear solicitud: ${createError.message}`);
      }

      // Asociar los tipos de datos a la solicitud
      if (createRequestDto.dataTypeIds && createRequestDto.dataTypeIds.length > 0) {
        const dataTypeEntries = createRequestDto.dataTypeIds.map((dataTypeId) => ({
          consent_request_id: request.id,
          data_type_id: dataTypeId,
        }));

        const { error: dataTypeError } = await this.supabase
          .from('consent_request_data_type')
          .insert(dataTypeEntries);

        if (dataTypeError) {
          this.logger.error(
            `Error al asociar tipos de datos: ${dataTypeError.message}`,
            dataTypeError,
          );
          // No fallamos completamente, solo loggeamos el error
        }
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.CREATE_CONSENT_REQUEST,
        resourceType: ResourceType.CONSENT_REQUEST,
        resourceId: request.id,
        userId: userId,
        metadata: {
          dataSubjectId: createRequestDto.dataSubjectId,
          legalPolicyId: createRequestDto.legalPolicyId,
          companyId: companyId,
        },
      });

      // Enviar email de solicitud de consentimiento si el canal es EMAIL
      if (createRequestDto.channel === 'EMAIL' && dataSubject.email) {
        // Construir el link para el consentimiento
        const baseUrl = process.env.PUBLIC_FRONTEND_URL || 'https://app.consentia.io';
        const consentLink = `${baseUrl}/consents/public/${token}`;

        try {
          await this.emailService.sendConsentRequestEmail({
            email: dataSubject.email,
            firstName: dataSubject.first_name,
            lastName: dataSubject.last_name,
            companyName: company.name,
            policyTitle: legalPolicy.title,
            purpose: createRequestDto.purpose,
            consentLink: consentLink,
            expirationDate: expiresAt,
          });

          this.logger.log(`Email de solicitud de consentimiento enviado a ${dataSubject.email}`);

          // Actualizar metadata para registrar que se envió el email
          await this.supabase
            .from('consent_request')
            .update({
              metadata: {
                ...request.metadata,
                email_sent: true,
                email_sent_at: new Date().toISOString(),
              },
            })
            .eq('id', request.id);

        } catch (emailError) {
          this.logger.error(
            `Error al enviar email de solicitud: ${emailError.message}`,
            emailError,
          );
          // No fallamos completamente si falla el envío del email
        }
      }

      // Transformar los datos al formato esperado
      return {
        id: request.id,
        dataSubjectId: request.data_subject_id,
        legalPolicyId: request.legal_policy_id,
        companyId: request.company_id,
        status: request.status,
        purpose: request.purpose,
        channel: request.channel,
        token: request.token,
        metadata: request.metadata,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        expiresAt: request.expires_at,
      };
    } catch (error) {
      this.logger.error('Error al crear solicitud de consentimiento', error);
      throw error;
    }
  }

  /**
   * Obtiene una solicitud de consentimiento por su ID
   * @param id - ID único de la solicitud de consentimiento a buscar
   * @returns Solicitud de consentimiento encontrada
   * @throws NotFoundException si la solicitud no existe
   * @throws Error si hay un problema al obtener la solicitud
   */
  async findRequest(id: string): Promise<ConsentRequestDto> {
    try {
      const { data, error } = await this.supabase
        .from('consent_request')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logger.error(`Solicitud no encontrada: ${error?.message}`);
        throw new NotFoundException(
          'Solicitud de consentimiento no encontrada',
        );
      }

      // Transformar la solicitud a camelCase
      return {
        id: data.id,
        dataSubjectId: data.data_subject_id,
        legalPolicyId: data.legal_policy_id,
        companyId: data.company_id,
        status: data.status,
        expiresAt: data.expires_at,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error al obtener solicitud: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Responde a una solicitud de consentimiento
   * @param id - ID único de la solicitud de consentimiento a responder
   * @param respondDto - DTO con la respuesta (aceptación o rechazo) a la solicitud
   * @param ipAddress - Dirección IP del usuario que responde (opcional)
   * @param userAgent - Agente de usuario del navegador que responde (opcional)
   * @returns Consentimiento creado como resultado de la respuesta
   * @throws NotFoundException si la solicitud no existe
   * @throws BadRequestException si la solicitud ya ha sido respondida o ha expirado
   * @throws Error si hay un problema al responder a la solicitud
   */
  async respondToRequest(
    id: string,
    respondDto: RespondConsentRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ConsentDto> {
    try {
      // Obtener la solicitud de consentimiento
      const { data: request, error: fetchError } = await this.supabase
        .from('consent_request')
        .select('*, legal_policy(*)')
        .eq('id', id)
        .single();

      if (fetchError || !request) {
        this.logger.error(`Solicitud no encontrada: ${fetchError?.message}`);
        throw new NotFoundException(
          'Solicitud de consentimiento no encontrada',
        );
      }

      // Verificar si la solicitud ya ha sido respondida
      if (request.status !== 'PENDING') {
        this.logger.error('La solicitud ya ha sido respondida');
        throw new BadRequestException('La solicitud ya ha sido respondida');
      }

      // Verificar si la solicitud ha expirado
      if (request.expires_at && new Date(request.expires_at) < new Date()) {
        this.logger.error('La solicitud ha expirado');
        throw new BadRequestException('La solicitud ha expirado');
      }

      // Determinar estado según respuesta
      const isAccepted = respondDto.response === 'GRANTED';
      const status = isAccepted ? ConsentStatus.GRANTED : ConsentStatus.DENIED;

      // Crear un nuevo registro de consentimiento
      const { data: consent, error: insertError } = await this.supabase
        .from('consent')
        .insert({
          data_subject_id: request.data_subject_id,
          legal_policy_id: request.legal_policy_id,
          consent_request_id: id,
          status: status,
          reason: respondDto.reason,
          metadata: {
            ip_address: ipAddress,
            user_agent: userAgent,
            timestamp: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (insertError) {
        this.logger.error(
          `Error al crear consentimiento: ${insertError.message}`,
          insertError,
        );
        throw new Error('Error al crear registro de consentimiento');
      }

      // Obtener los tipos de datos de la solicitud
      const { data: requestDataTypes, error: dataTypesError } = await this.supabase
        .from('consent_request_data_type')
        .select('data_type_id')
        .eq('consent_request_id', id);

      // Si la solicitud se aceptó y hay tipos de datos, registrarlos
      if (isAccepted && requestDataTypes && requestDataTypes.length > 0) {
        const dataTypeEntries = requestDataTypes.map(
          (dt) => ({
            consent_id: consent.id,
            data_type_id: dt.data_type_id,
          }),
        );

        const { error: dtError } = await this.supabase
          .from('consent_data_type')
          .insert(dataTypeEntries);

        if (dtError) {
          this.logger.error(
            `Error al registrar tipos de datos: ${dtError.message}`,
            dtError,
          );
        }
      }

      // Actualizar el estado de la solicitud
      const { error: updateError } = await this.supabase
        .from('consent_request')
        .update({
          status: 'RESPONDED',
        })
        .eq('id', id);

      if (updateError) {
        this.logger.error(
          `Error al actualizar solicitud: ${updateError.message}`,
          updateError,
        );
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: isAccepted
          ? AuditAction.CREATE_CONSENT
          : AuditAction.DELETE,
        resourceType: ResourceType.CONSENT,
        resourceId: consent.id,
        metadata: {
          accepted: isAccepted,
          policyTitle: request.legal_policy?.title,
        },
        ipAddress,
        userAgent,
      });

      // Transformar el consentimiento a camelCase
      return {
        id: consent.id,
        dataSubjectId: consent.data_subject_id,
        legalPolicyId: consent.legal_policy_id,
        consentRequestId: consent.consent_request_id,
        status: consent.status,
        reason: consent.reason,
        metadata: consent.metadata,
        createdAt: consent.created_at,
        updatedAt: consent.updated_at,
        expiresAt: consent.expires_at,
      };
    } catch (error) {
      this.logger.error(
        `Error al responder solicitud: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Valida la transición de estado de un consentimiento
   * @param currentStatus - Estado actual del consentimiento
   * @param newStatus - Nuevo estado al que se quiere transicionar
   * @throws BadRequestException si la transición de estado no es válida
   * @private
   */
  private validateStatusTransition(
    currentStatus: ConsentStatus,
    newStatus: ConsentStatus,
  ): void {
    // Definir las transiciones válidas
    const validTransitions: Record<ConsentStatus, ConsentStatus[]> = {
      [ConsentStatus.PENDING]: [ConsentStatus.GRANTED, ConsentStatus.DENIED],
      [ConsentStatus.GRANTED]: [ConsentStatus.REVOKED, ConsentStatus.EXPIRED],
      [ConsentStatus.DENIED]: [ConsentStatus.GRANTED],
      [ConsentStatus.REVOKED]: [],
      [ConsentStatus.EXPIRED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Transición de estado inválida: de ${currentStatus} a ${newStatus}`,
      );
    }
  }

  /**
   * Obtiene detalles de una solicitud de consentimiento por su token
   * @param token - Token único de la solicitud
   * @param ipAddress - Dirección IP del usuario que accede (opcional)
   * @param userAgent - Agente de usuario del navegador que accede (opcional)
   * @returns Detalles completos de la solicitud de consentimiento
   * @throws NotFoundException si la solicitud no existe
   * @throws GoneException si la solicitud ha expirado
   * @throws Error si hay un problema al obtener los detalles
   */
  async getConsentDetailsByToken(
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ConsentWithDetailsDto> {
    try {
      // Obtener la solicitud con datos de política legal y titular de datos
      const { data, error } = await this.supabase
        .from('consent_request')
        .select(`
          *,
          legal_policy(*),
          data_subject(*),
          consent_request_data_type(
            *,
            data_type(*)
          )
        `)
        .eq('token', token)
        .single();

      if (error || !data) {
        this.logger.error(`Solicitud no encontrada: ${error?.message}`);
        throw new NotFoundException('Solicitud de consentimiento no encontrada');
      }

      // Verificar si la solicitud ha expirado
      const now = new Date();
      const expiryDate = new Date(data.expires_at);
      if (expiryDate < now) {
        throw new GoneException('Esta solicitud de consentimiento ha expirado');
      }

      // Registrar la vista en el log de auditoría
      await this.auditService.log({
        action: AuditAction.VIEW_CONSENT_REQUEST,
        resourceType: ResourceType.CONSENT_REQUEST,
        resourceId: data.id,
        dataSubjectId: data.data_subject_id,
        ipAddress,
        userAgent,
        metadata: {
          token,
        },
      });

      // Extraer los datos necesarios
      const { legal_policy, data_subject, consent_request_data_type, ...requestData } = data;

      // Transformar los tipos de datos
      const dataTypes = consent_request_data_type?.map((item) => ({
        id: item.data_type?.id || '',
        name: item.data_type?.name || '',
        code: item.data_type?.code || '',
        description: item.data_type?.description || '',
        category: item.data_type?.category || '',
        isRequired: !!item.is_required,
      })) || [];

      // Crear el objeto legalPolicy con la estructura correcta del DTO
      const legalPolicyDto = {
        id: legal_policy?.id || '',
        title: legal_policy?.title || '',
        content: legal_policy?.content || '',
        version: legal_policy?.version || 1,
        validFrom: legal_policy?.valid_from || '',
        validTo: legal_policy?.valid_to || null,
        dataTypes: legal_policy?.data_types || [],
        status: legal_policy?.status || '',
        metadata: legal_policy?.metadata || {},
        companyId: legal_policy?.company_id || '',
        createdAt: legal_policy?.created_at || '',
        updatedAt: legal_policy?.updated_at || '',
      };

      // Crear la respuesta
      return {
        id: requestData.id,
        status: requestData.status,
        purpose: requestData.purpose,
        channel: requestData.channel,
        createdAt: requestData.created_at,
        updatedAt: requestData.updated_at,
        expiresAt: requestData.expires_at,
        metadata: requestData.metadata || {},
        dataSubject: {
          id: data_subject?.id || '',
          email: data_subject?.email || '',
          firstName: data_subject?.first_name || '',
          lastName: data_subject?.last_name || '',
          phone: data_subject?.phone || '',
        },
        legalPolicy: legalPolicyDto,
        dataTypes,
        companyId: requestData.company_id,
      };
    } catch (error) {
      this.logger.error(`Error al obtener detalles por token: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Procesa la respuesta a una solicitud de consentimiento
   * @param token - Token único de la solicitud
   * @param status - Estado del consentimiento (GRANTED o REJECTED)
   * @param reason - Razón opcional de la decisión
   * @param ipAddress - Dirección IP del cliente que realiza la respuesta
   * @param userAgent - User Agent del cliente que realiza la respuesta
   * @returns El consentimiento creado con la respuesta
   * @throws NotFoundException si la solicitud no existe
   * @throws BadRequestException si la solicitud está expirada o ya fue procesada
   * @throws Error si hay un problema al procesar la respuesta
   */
  async respondToConsent(
    token: string,
    status: ConsentStatus,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ConsentDto> {
    try {
      // Obtener la solicitud de consentimiento
      const { data: request, error: requestError } = await this.supabase
        .from('consent_request')
        .select('*')
        .eq('token', token)
        .single();

      if (requestError || !request) {
        this.logger.error(
          `Solicitud de consentimiento no encontrada: ${requestError?.message}`,
        );
        throw new NotFoundException('Solicitud de consentimiento no encontrada');
      }

      // Verificar si la solicitud está expirada
      if (request.status === 'EXPIRED' || new Date(request.expires_at) < new Date()) {
        // Actualizar el estado a expirado si no lo estaba ya
        if (request.status !== 'EXPIRED') {
          await this.supabase
            .from('consent_request')
            .update({ status: 'EXPIRED' })
            .eq('id', request.id);
        }
        throw new BadRequestException('Solicitud de consentimiento expirada', { cause: { code: 'EXPIRED' } });
      }

      // Verificar si la solicitud ya fue procesada
      if (request.status !== 'PENDING') {
        throw new BadRequestException(
          'Esta solicitud de consentimiento ya fue procesada',
          { cause: { code: 'ALREADY_PROCESSED' } }
        );
      }

      // Actualizar el estado de la solicitud
      const newRequestStatus = status === ConsentStatus.GRANTED ? 'ACCEPTED' : 'REJECTED';
      await this.supabase
        .from('consent_request')
        .update({ status: newRequestStatus })
        .eq('id', request.id);

      // Obtener los tipos de datos asociados a la solicitud
      const { data: dataTypes, error: dataTypesError } = await this.supabase
        .from('consent_request_data_type')
        .select('data_type_id')
        .eq('consent_request_id', request.id);

      if (dataTypesError) {
        this.logger.error(
          `Error al obtener tipos de datos: ${dataTypesError.message}`,
          dataTypesError,
        );
        // Continuamos sin tipos de datos si hay un error
      }

      // Crear el registro de consentimiento
      const { data: consent, error: consentError } = await this.supabase
        .from('consent')
        .insert({
          data_subject_id: request.data_subject_id,
          legal_policy_id: request.legal_policy_id,
          consent_request_id: request.id,
          status: status,
          reason: reason,
          metadata: {
            ...request.metadata,
            response_ip: ipAddress,
            response_user_agent: userAgent,
            response_timestamp: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (consentError) {
        this.logger.error(
          `Error al crear consentimiento: ${consentError.message}`,
          consentError,
        );
        throw new Error(`Error al crear consentimiento: ${consentError.message}`);
      }

      // Asociar los tipos de datos al consentimiento
      if (dataTypes && dataTypes.length > 0) {
        const consentDataTypeEntries = dataTypes.map((dt) => ({
          consent_id: consent.id,
          data_type_id: dt.data_type_id,
        }));

        const { error: linkError } = await this.supabase
          .from('consent_data_type')
          .insert(consentDataTypeEntries);

        if (linkError) {
          this.logger.error(
            `Error al asociar tipos de datos al consentimiento: ${linkError.message}`,
            linkError,
          );
          // No fallamos completamente, solo loggeamos el error
        }
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.RESPOND_TO_CONSENT,
        resourceType: ResourceType.CONSENT,
        resourceId: consent.id,
        metadata: {
          requestId: request.id,
          token,
          status,
          reason,
          ipAddress,
          userAgent,
        },
      });

      // Transformar los datos al formato esperado
      return {
        id: consent.id,
        dataSubjectId: consent.data_subject_id,
        legalPolicyId: consent.legal_policy_id,
        consentRequestId: consent.consent_request_id,
        status: consent.status,
        reason: consent.reason,
        metadata: consent.metadata,
        createdAt: consent.created_at,
        updatedAt: consent.updated_at,
        expiresAt: consent.expires_at,
      };
    } catch (error) {
      this.logger.error(
        `Error al responder a solicitud de consentimiento: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Revoca un consentimiento previamente otorgado
   * @param id - ID único del consentimiento a revocar
   * @param reason - Razón opcional de la revocación
   * @param userId - ID del usuario que realiza la revocación (admin/operator) o null/undefined si es el titular
   * @returns El consentimiento actualizado con el nuevo estado
   * @throws NotFoundException si el consentimiento no existe
   * @throws BadRequestException si el consentimiento no es revocable
   * @throws Error si hay un problema al revocar el consentimiento
   */
  async revokeConsent(
    id: string,
    reason?: string,
    userId?: string | null,
  ): Promise<ConsentDto> {
    try {
      // Obtener el consentimiento actual
      const { data: currentConsent, error: fetchError } = await this.supabase
        .from('consent')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentConsent) {
        this.logger.error(
          `Consentimiento no encontrado: ${fetchError?.message}`,
        );
        throw new NotFoundException('Consentimiento no encontrado');
      }

      // Verificar si el consentimiento es revocable
      if (currentConsent.status !== ConsentStatus.GRANTED) {
        throw new BadRequestException(
          'Solo se pueden revocar consentimientos que hayan sido otorgados',
        );
      }

      // Actualizar el estado del consentimiento
      const { data: updatedConsent, error: updateError } = await this.supabase
        .from('consent')
        .update({
          status: ConsentStatus.REVOKED,
          reason: reason,
          metadata: {
            ...currentConsent.metadata,
            revoked_at: new Date().toISOString(),
            revoked_by: userId || 'data_subject',
          },
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        this.logger.error(
          `Error al revocar consentimiento: ${updateError.message}`,
          updateError,
        );
        throw new Error(`Error al revocar consentimiento: ${updateError.message}`);
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.REVOKE_CONSENT,
        resourceType: ResourceType.CONSENT,
        resourceId: id,
        userId: userId || undefined,
        dataSubjectId: currentConsent.data_subject_id,
        metadata: {
          previousStatus: currentConsent.status,
          newStatus: ConsentStatus.REVOKED,
          reason,
          revokedByDataSubject: !userId,
        },
      });

      // Transformar los datos al formato esperado
      return {
        id: updatedConsent.id,
        dataSubjectId: updatedConsent.data_subject_id,
        legalPolicyId: updatedConsent.legal_policy_id,
        consentRequestId: updatedConsent.consent_request_id,
        status: updatedConsent.status,
        reason: updatedConsent.reason,
        metadata: updatedConsent.metadata,
        createdAt: updatedConsent.created_at,
        updatedAt: updatedConsent.updated_at,
        expiresAt: updatedConsent.expires_at,
      };
    } catch (error) {
      this.logger.error(
        `Error al revocar consentimiento: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Genera un token único para la solicitud de consentimiento
   * @returns Token único de 64 caracteres
   */
  private generateUniqueToken(): string {
    // Generar un token aleatorio de 64 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Obtiene el historial de consentimientos de un titular de datos específico
   * @param dataSubjectId - ID del titular de datos
   * @returns Lista del historial de consentimientos del titular
   * @throws NotFoundException si el titular no existe
   * @throws InternalServerErrorException si hay un error en la base de datos
   */
  async getConsentHistory(dataSubjectId: string): Promise<ConsentHistoryDto[]> {
    try {
      // Verificar que el titular existe
      const { data: dataSubject, error: dsError } = await this.supabase
        .from('data_subject')
        .select('id')
        .eq('id', dataSubjectId)
        .single();
      
      if (dsError || !dataSubject) {
        this.logger.error(`Titular de datos no encontrado: ${dsError?.message}`);
        throw new NotFoundException('Titular de datos no encontrado');
      }
      
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
        throw new InternalServerErrorException('Error al obtener historial de consentimientos');
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Transformar los datos a DTOs
      return data.map(consent => {
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
        
        // Extraer los tipos de datos
        const dataTypes = Array.isArray(consent.consent_data_type) 
          ? consent.consent_data_type.map(item => {
              const dataType = handleNestedProperty(item.data_type);
              return {
                id: safeValue(dataType, 'id', ''),
                name: safeValue(dataType, 'name', ''),
                code: safeValue(dataType, 'code', '')
              };
            })
          : [];
        
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
          dataTypes,
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
      this.logger.error(`Error al obtener historial de consentimientos: ${error.message}`, error);
      throw new InternalServerErrorException('Error inesperado al obtener historial de consentimientos');
    }
  }
}
