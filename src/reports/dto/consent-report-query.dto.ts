import { IsOptional, IsUUID, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsentStatus } from '../../consents/dto';

/**
 * DTO para las consultas de reportes de consentimientos
 */
export class ConsentReportQueryDto {
  /**
   * ID de la compañía para filtrar consentimientos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsOptional()
  companyId?: string;

  /**
   * ID de la política legal para filtrar consentimientos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsOptional()
  legalPolicyId?: string;

  /**
   * Estado del consentimiento para filtrar
   * @example "GRANTED"
   */
  @IsEnum(ConsentStatus)
  @IsOptional()
  status?: ConsentStatus;

  /**
   * Fecha de inicio para filtrar consentimientos (creados después de esta fecha)
   * @example "2023-01-01T00:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  startDate?: string;

  /**
   * Fecha de fin para filtrar consentimientos (creados antes de esta fecha)
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