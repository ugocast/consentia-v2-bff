import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConsentsService } from '../consents/consents.service';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';
import { BulkOperationDto, CreateBulkOperationDto, UpdateBulkOperationDto } from './dto';
import { ConsentStatus } from '../consents/dto';

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);
  private operations: BulkOperationDto[] = [];

  constructor(
    private readonly consentsService: ConsentsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Crea una nueva operación masiva
   * @param companyId - ID de la compañía que realiza la operación
   * @param createDto - DTO con los datos para crear la operación
   * @param userId - ID del usuario que crea la operación
   * @returns Operación masiva creada
   * @throws Error si hay un problema al crear la operación
   */
  async create(companyId: string, createDto: CreateBulkOperationDto, userId: string): Promise<BulkOperationDto> {
    try {
      const operation: BulkOperationDto = {
        id: Date.now().toString(),
        type: createDto.type,
        items: createDto.items,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        created_by: userId,
        company_id: companyId,
      };

      this.operations.push(operation);

      await this.auditService.log({
        action: AuditAction.CREATE_BULK_OPERATION,
        resourceType: ResourceType.BULK_OPERATION,
        resourceId: operation.id,
        userId,
        metadata: {
          type: operation.type,
          itemCount: operation.items.length,
        },
      });

      this.logger.log(`Created bulk operation ${operation.id} of type ${operation.type}`);
      return operation;
    } catch (error) {
      this.logger.error(`Error creating bulk operation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesa una operación masiva
   * @param companyId - ID de la compañía que procesa la operación
   * @param operationId - ID de la operación a procesar
   * @param processDto - DTO con datos para el procesamiento
   * @param userId - ID del usuario que procesa la operación
   * @returns Operación masiva procesada
   * @throws NotFoundException si la operación no existe
   * @throws Error si hay un problema al procesar la operación
   */
  async processBulkOperation(
    companyId: string, 
    operationId: string, 
    processDto: any, 
    userId: string
  ): Promise<BulkOperationDto> {
    try {
      const operation = await this.findOne(companyId, operationId);
      if (!operation) {
        throw new NotFoundException(`Bulk operation with ID ${operationId} not found`);
      }

      operation.status = 'PROCESSING';
      operation.updated_at = new Date().toISOString();
      operation.updated_by = userId;
      
      // Agregar comentarios si existen
      if (processDto?.comments) {
        operation.comments = processDto.comments;
      }
      
      // Agregar metadatos si existen
      if (processDto?.metadata) {
        operation.metadata = {
          ...operation.metadata,
          ...processDto.metadata
        };
      }

      await this.auditService.log({
        action: AuditAction.PROCESS_BULK_OPERATION,
        resourceType: ResourceType.BULK_OPERATION,
        resourceId: operation.id,
        userId,
        metadata: {
          status: operation.status,
          comments: processDto?.comments,
          processingMetadata: processDto?.metadata
        },
      });

      this.logger.log(`Processing bulk operation ${operation.id} of type ${operation.type}`);

      switch (operation.type) {
        case 'create_consent':
          await this.processCreateConsents(operation, userId);
          break;
        case 'update_consent':
          await this.processUpdateConsents(operation, userId);
          break;
        case 'revoke_consent':
          await this.processRevokeConsents(operation, userId);
          break;
        case 'delete_consent':
          await this.processDeleteConsents(operation, userId);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }

      operation.status = 'COMPLETED';
      operation.completed_at = new Date().toISOString();
      operation.updated_at = new Date().toISOString();
      operation.updated_by = userId;

      await this.auditService.log({
        action: AuditAction.COMPLETE_BULK_OPERATION,
        resourceType: ResourceType.BULK_OPERATION,
        resourceId: operation.id,
        userId,
        metadata: {
          status: operation.status,
        },
      });

      this.logger.log(`Completed bulk operation ${operation.id}`);
      return operation;
    } catch (error) {
      this.logger.error(`Error processing bulk operation ${operationId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtiene una operación masiva por su ID
   * @param companyId - ID de la compañía
   * @param id - ID de la operación a buscar
   * @returns Operación masiva encontrada
   * @throws NotFoundException si la operación no existe
   */
  async findOne(companyId: string, id: string): Promise<BulkOperationDto> {
    const operation = this.operations.find(op => op.id === id && op.company_id === companyId);
    if (!operation) {
      throw new NotFoundException(`Bulk operation with ID ${id} not found`);
    }
    return operation;
  }

  /**
   * Obtiene todas las operaciones masivas de una compañía
   * @param companyId - ID de la compañía
   * @param filters - Filtros opcionales para la búsqueda
   * @returns Lista de operaciones masivas
   */
  async findAll(companyId: string, filters?: { status?: string; type?: string }): Promise<BulkOperationDto[]> {
    let operations = this.operations.filter(op => op.company_id === companyId);
    
    // Aplicar filtros si se proporcionan
    if (filters) {
      if (filters.status) {
        operations = operations.filter(op => op.status === filters.status);
      }
      
      if (filters.type) {
        operations = operations.filter(op => op.type === filters.type);
      }
    }
    
    return operations;
  }

  /**
   * Actualiza una operación masiva
   * @param companyId - ID de la compañía
   * @param id - ID de la operación a actualizar
   * @param updateData - Datos para actualizar la operación
   * @param userId - ID del usuario que actualiza la operación
   * @returns Operación masiva actualizada
   * @throws NotFoundException si la operación no existe
   */
  async update(companyId: string, id: string, updateData: UpdateBulkOperationDto, userId: string): Promise<BulkOperationDto> {
    try {
      const operation = await this.findOne(companyId, id);
      
      Object.assign(operation, {
        ...updateData,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      });

      await this.auditService.log({
        action: AuditAction.UPDATE_BULK_OPERATION,
        resourceType: ResourceType.BULK_OPERATION,
        resourceId: operation.id,
        userId,
        metadata: updateData,
      });

      this.logger.log(`Updated bulk operation ${operation.id}`);
      return operation;
    } catch (error) {
      this.logger.error(`Error updating bulk operation ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una operación masiva
   * @param companyId - ID de la compañía
   * @param id - ID de la operación a actualizar
   * @param status - Nuevo estado de la operación
   * @param userId - ID del usuario que actualiza el estado
   * @returns Operación masiva actualizada
   * @throws NotFoundException si la operación no existe
   */
  async updateStatus(companyId: string, id: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED', userId: string): Promise<BulkOperationDto> {
    try {
      const operation = await this.findOne(companyId, id);
      
      operation.status = status;
      operation.updated_at = new Date().toISOString();
      operation.updated_by = userId;

      await this.auditService.log({
        action: AuditAction.UPDATE_BULK_OPERATION_STATUS,
        resourceType: ResourceType.BULK_OPERATION,
        resourceId: operation.id,
        userId,
        metadata: {
          status,
        },
      });

      this.logger.log(`Updated status of bulk operation ${operation.id} to ${status}`);
      return operation;
    } catch (error) {
      this.logger.error(`Error updating status of bulk operation ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Elimina una operación masiva
   * @param companyId - ID de la compañía
   * @param id - ID de la operación a eliminar
   * @param userId - ID del usuario que elimina la operación
   * @throws NotFoundException si la operación no existe
   */
  async remove(companyId: string, id: string, userId: string): Promise<void> {
    try {
      const operation = await this.findOne(companyId, id);
      const index = this.operations.findIndex(op => op.id === id && op.company_id === companyId);
      
      if (index > -1) {
        this.operations.splice(index, 1);
      }

      await this.auditService.log({
        action: AuditAction.DELETE_BULK_OPERATION,
        resourceType: ResourceType.BULK_OPERATION,
        resourceId: operation.id,
        userId,
        metadata: {
          type: operation.type,
          status: operation.status,
        },
      });

      this.logger.log(`Removed bulk operation ${operation.id}`);
    } catch (error) {
      this.logger.error(`Error removing bulk operation ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesa la creación masiva de consentimientos
   * @param operation - Operación masiva a procesar
   * @param userId - ID del usuario que procesa la operación
   */
  private async processCreateConsents(operation: BulkOperationDto, userId: string): Promise<void> {
    for (const item of operation.items) {
      await this.consentsService.createRequest(item, item.companyId || operation.company_id, userId);
    }
  }

  /**
   * Procesa la actualización masiva de consentimientos
   * @param operation - Operación masiva a procesar
   * @param userId - ID del usuario que procesa la operación
   */
  private async processUpdateConsents(operation: BulkOperationDto, userId: string): Promise<void> {
    for (const item of operation.items) {
      await this.consentsService.updateStatus(item.id, {
        status: item.status,
        reason: item.reason,
        metadata: item.metadata
      }, userId);
    }
  }

  /**
   * Procesa la revocación masiva de consentimientos
   * @param operation - Operación masiva a procesar
   * @param userId - ID del usuario que procesa la operación
   */
  private async processRevokeConsents(operation: BulkOperationDto, userId: string): Promise<void> {
    for (const item of operation.items) {
      await this.consentsService.updateStatus(item.id, {
        status: ConsentStatus.REVOKED,
        reason: item.reason,
        metadata: item.metadata
      }, userId);
    }
  }

  /**
   * Procesa la eliminación masiva de consentimientos
   * @param operation - Operación masiva a procesar
   * @param userId - ID del usuario que procesa la operación
   */
  private async processDeleteConsents(operation: BulkOperationDto, userId: string): Promise<void> {
    for (const item of operation.items) {
      await this.consentsService.updateStatus(item.id, {
        status: ConsentStatus.DENIED,
        reason: item.reason,
        metadata: item.metadata
      }, userId);
    }
  }
}
