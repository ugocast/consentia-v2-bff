import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ConsentDataTypeStatus } from './consent-data-type-status.enum';

/**
 * DTO para la creación de tipos de datos de consentimiento
 */
export class CreateConsentDataTypeDto {
  /**
   * ID del consentimiento al que pertenece el tipo de dato
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsString()
  @IsNotEmpty()
  consentId: string;

  /**
   * ID del tipo de dato
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsString()
  @IsNotEmpty()
  dataTypeId: string;

  /**
   * Estado del tipo de dato de consentimiento
   * @example "active"
   */
  @IsEnum(ConsentDataTypeStatus)
  @IsOptional()
  status?: ConsentDataTypeStatus = ConsentDataTypeStatus.ACTIVE;

  /**
   * Metadatos adicionales del tipo de dato de consentimiento
   * @example { "retentionPeriod": "1y", "processingPurpose": "marketing" }
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 