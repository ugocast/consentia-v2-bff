import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
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
} from './dto';

@Injectable()
export class ConsentsService {
  private readonly logger = new Logger(ConsentsService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

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
      }));

      // Transformar la política legal si existe
      const legalPolicy = legal_policy ? {
        id: legal_policy.id,
        title: legal_policy.title,
        content: legal_policy.content,
        companyId: legal_policy.company_id,
        previousVersionId: legal_policy.previous_version_id,
        validFrom: legal_policy.valid_from,
        validTo: legal_policy.valid_to,
        dataTypes: legal_policy.data_types,
        createdAt: legal_policy.created_at,
        updatedAt: legal_policy.updated_at,
        version: legal_policy.version,
        status: legal_policy.status,
        createdBy: legal_policy.created_by,
      } : undefined;

      // Transformar el titular de datos si existe
      const dataSubject = data_subject ? {
        id: data_subject.id,
        email: data_subject.email,
        name: data_subject.name,
      } : undefined;

      // Transformar el consentimiento
      return {
        id: consentData.id,
        dataSubjectId: consentData.data_subject_id,
        legalPolicyId: consentData.legal_policy_id,
        consentRequestId: consentData.consent_request_id,
        status: consentData.status,
        reason: consentData.reason,
        metadata: consentData.metadata,
        createdAt: consentData.created_at,
        updatedAt: consentData.updated_at,
        expiresAt: consentData.expires_at,
        dataTypes,
        legalPolicy,
        dataSubject,
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
   * @param createRequestDto - DTO con los datos para crear la solicitud de consentimiento
   * @param userId - ID del usuario que crea la solicitud
   * @returns Solicitud de consentimiento creada
   * @throws NotFoundException si la política legal no existe
   * @throws BadRequestException si alguno de los tipos de datos no existe
   * @throws Error si hay un problema al crear la solicitud
   */
  async createRequest(
    createRequestDto: CreateConsentRequestDto,
    userId: string,
  ): Promise<ConsentRequestDto> {
    try {
      // Verificar si la política legal existe
      const { data: policy, error: policyError } = await this.supabase
        .from('legal_policy')
        .select('id, company_id')
        .eq('id', createRequestDto.legalPolicyId)
        .single();

      if (policyError || !policy) {
        this.logger.error(
          `Política legal no encontrada: ${policyError?.message}`,
        );
        throw new NotFoundException('Política legal no encontrada');
      }

      // Verificar si los tipos de datos existen
      const { data: dataTypes, error: dataTypesError } = await this.supabase
        .from('data_type')
        .select('id')
        .in('id', createRequestDto.dataTypeIds);

      if (dataTypesError) {
        this.logger.error(
          `Error al verificar tipos de datos: ${dataTypesError.message}`,
          dataTypesError,
        );
        throw new Error(
          `Error al verificar tipos de datos: ${dataTypesError.message}`,
        );
      }

      if (dataTypes.length !== createRequestDto.dataTypeIds.length) {
        this.logger.error('Algunos tipos de datos no existen');
        throw new BadRequestException('Algunos tipos de datos no existen');
      }

      // Buscar o crear el titular de los datos
      let dataSubjectId: string;
      const { data: existingDataSubject, error: dataSubjectError } =
        await this.supabase
          .from('data_subject')
          .select('id')
          .eq('email', createRequestDto.dataSubjectEmail)
          .maybeSingle();

      if (dataSubjectError) {
        this.logger.error(
          `Error al buscar titular de datos: ${dataSubjectError.message}`,
          dataSubjectError,
        );
        throw new Error(
          `Error al buscar titular de datos: ${dataSubjectError.message}`,
        );
      }

      if (existingDataSubject) {
        dataSubjectId = existingDataSubject.id;
      } else {
        // Crear nuevo titular de datos
        const { data: newDataSubject, error: createDataSubjectError } =
          await this.supabase
            .from('data_subject')
            .insert({
              email: createRequestDto.dataSubjectEmail,
              name: createRequestDto.dataSubjectName,
            })
            .select()
            .single();

        if (createDataSubjectError) {
          this.logger.error(
            `Error al crear titular de datos: ${createDataSubjectError.message}`,
            createDataSubjectError,
          );
          throw new Error(
            `Error al crear titular de datos: ${createDataSubjectError.message}`,
          );
        }

        dataSubjectId = newDataSubject.id;
      }

      // Calcular fecha de expiración (30 días por defecto)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Crear la solicitud de consentimiento
      const { data: consentRequest, error: createRequestError } =
        await this.supabase
          .from('consent_request')
          .insert({
            data_subject_id: dataSubjectId,
            legal_policy_id: createRequestDto.legalPolicyId,
            company_id: policy.company_id,
            status: 'PENDING',
            expires_at: expiresAt.toISOString(),
            metadata: {
              ...createRequestDto.metadata,
              data_type_ids: createRequestDto.dataTypeIds,
              created_by: userId,
            },
          })
          .select()
          .single();

      if (createRequestError) {
        this.logger.error(
          `Error al crear solicitud: ${createRequestError.message}`,
          createRequestError,
        );
        throw new Error(
          `Error al crear solicitud: ${createRequestError.message}`,
        );
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.CREATE,
        resourceType: ResourceType.CONSENT_REQUEST,
        resourceId: consentRequest.id,
        userId,
        metadata: {
          dataSubjectEmail: createRequestDto.dataSubjectEmail,
          legalPolicyId: createRequestDto.legalPolicyId,
          dataTypeIds: createRequestDto.dataTypeIds,
        },
      });

      // Transformar la solicitud a camelCase
      return {
        id: consentRequest.id,
        dataSubjectId: consentRequest.data_subject_id,
        legalPolicyId: consentRequest.legal_policy_id,
        companyId: consentRequest.company_id,
        status: consentRequest.status,
        expiresAt: consentRequest.expires_at,
        metadata: consentRequest.metadata,
        createdAt: consentRequest.created_at,
        updatedAt: consentRequest.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error al crear solicitud: ${error.message}`, error);
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

      // Crear un nuevo registro de consentimiento
      const { data: consent, error: insertError } = await this.supabase
        .from('consent')
        .insert({
          data_subject_id: request.data_subject_id,
          legal_policy_id: request.legal_policy_id,
          consent_request_id: id,
          status: respondDto.accepted
            ? ConsentStatus.GRANTED
            : ConsentStatus.DENIED,
          metadata: {
            ...respondDto.metadata,
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

      // Si se aceptó y hay tipos de datos aceptados, registrarlos
      if (
        respondDto.accepted &&
        respondDto.acceptedDataTypeIds &&
        respondDto.acceptedDataTypeIds.length > 0
      ) {
        const dataTypeEntries = respondDto.acceptedDataTypeIds.map(
          (dataTypeId) => ({
            consent_id: consent.id,
            data_type_id: dataTypeId,
          }),
        );

        const { error: dataTypeError } = await this.supabase
          .from('consent_data_type')
          .insert(dataTypeEntries);

        if (dataTypeError) {
          this.logger.error(
            `Error al registrar tipos de datos: ${dataTypeError.message}`,
            dataTypeError,
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
        action: respondDto.accepted
          ? AuditAction.CREATE_CONSENT
          : AuditAction.DELETE,
        resourceType: ResourceType.CONSENT,
        resourceId: consent.id,
        metadata: {
          accepted: respondDto.accepted,
          acceptedDataTypeIds: respondDto.acceptedDataTypeIds,
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
}
