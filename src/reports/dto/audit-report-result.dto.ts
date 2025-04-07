import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { AuditAction, ResourceType } from '../../common/audit/audit.service';

/**
 * DTO para un registro de auditoría
 */
export class AuditLogDto {
  /**
   * ID único del registro de auditoría
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * Tipo de acción realizada
   * @example "CREATE_CONSENT"
   */
  action: AuditAction;

  /**
   * Tipo de recurso afectado
   * @example "CONSENT"
   */
  resourceType: ResourceType;

  /**
   * ID del recurso afectado
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  resourceId: string;

  /**
   * ID del usuario que realizó la acción
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  userId?: string;

  /**
   * ID del recurso anterior (en caso de actualizaciones)
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  previousResourceId?: string;

  /**
   * Metadatos adicionales del registro de auditoría
   */
  metadata?: Record<string, any>;

  /**
   * Dirección IP desde donde se realizó la acción
   * @example "192.168.1.1"
   */
  ipAddress?: string;

  /**
   * User agent del navegador desde donde se realizó la acción
   * @example "Mozilla/5.0..."
   */
  userAgent?: string;

  /**
   * Fecha de creación del registro de auditoría
   * @example "2023-01-01T00:00:00.000Z"
   */
  createdAt: string;
}

/**
 * DTO para los resultados de reportes de auditoría
 */
export class AuditReportResultDto {
  /**
   * Lista de registros de auditoría
   */
  items: AuditLogDto[];

  /**
   * Número total de registros que coinciden con los filtros
   * @example 100
   */
  total: number;

  /**
   * Número de página actual
   * @example 1
   */
  page: number;

  /**
   * Tamaño de página
   * @example 10
   */
  pageSize: number;

  /**
   * Número total de páginas
   * @example 10
   */
  totalPages: number;
}
