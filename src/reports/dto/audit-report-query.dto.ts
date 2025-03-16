import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, ResourceType } from '../../common/audit/audit.service';

/**
 * DTO para las consultas de reportes de auditoría
 */
export class AuditReportQueryDto {
  /**
   * ID de la compañía para filtrar registros de auditoría
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsOptional()
  companyId?: string;

  /**
   * ID del usuario para filtrar registros de auditoría
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsOptional()
  userId?: string;

  /**
   * Tipo de acción para filtrar registros de auditoría
   * @example "CREATE_CONSENT"
   */
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  /**
   * Tipo de recurso para filtrar registros de auditoría
   * @example "CONSENT"
   */
  @IsEnum(ResourceType)
  @IsOptional()
  resourceType?: ResourceType;

  /**
   * ID del recurso para filtrar registros de auditoría
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsOptional()
  resourceId?: string;

  /**
   * Fecha de inicio para filtrar registros de auditoría (creados después de esta fecha)
   * @example "2023-01-01T00:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  startDate?: string;

  /**
   * Fecha de fin para filtrar registros de auditoría (creados antes de esta fecha)
   * @example "2023-12-31T23:59:59.999Z"
   */
  @IsDateString()
  @IsOptional()
  endDate?: string;

  /**
   * Número de página para paginación
   * @example 1
   */
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  /**
   * Tamaño de página para paginación (máximo 100)
   * @example 10
   */
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10;
}
