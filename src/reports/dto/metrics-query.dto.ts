import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';

/**
 * Enum para los tipos de agrupación de métricas
 */
export enum MetricsGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  POLICY = 'policy',
  STATUS = 'status',
}

/**
 * DTO para las consultas de métricas
 */
export class MetricsQueryDto {
  /**
   * ID de la compañía para filtrar métricas
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsOptional()
  companyId?: string;

  /**
   * Fecha de inicio para filtrar métricas (creadas después de esta fecha)
   * @example "2023-01-01T00:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  startDate?: string;

  /**
   * Fecha de fin para filtrar métricas (creadas antes de esta fecha)
   * @example "2023-12-31T23:59:59.999Z"
   */
  @IsDateString()
  @IsOptional()
  endDate?: string;

  /**
   * Tipo de agrupación para las métricas
   * @example "month"
   */
  @IsEnum(MetricsGroupBy)
  @IsOptional()
  groupBy?: MetricsGroupBy = MetricsGroupBy.MONTH;
}
