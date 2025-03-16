import {
  IsBoolean,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

/**
 * Enum para los tipos de respuesta a solicitudes de consentimiento
 */
export enum ConsentResponseType {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

/**
 * DTO para responder a solicitudes de consentimiento
 */
export class RespondConsentRequestDto {
  /**
   * Indica si se acepta o rechaza el consentimiento
   * @example true
   */
  @IsBoolean()
  @IsNotEmpty()
  accepted: boolean;

  /**
   * Tipo de respuesta (ACCEPT o REJECT)
   * @example "ACCEPT"
   * @deprecated Use accepted instead
   */
  @IsEnum(ConsentResponseType)
  @IsOptional()
  response?: ConsentResponseType;

  /**
   * IDs de los tipos de datos aceptados (solo si accepted es true)
   * @example ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174000"]
   */
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  acceptedDataTypeIds?: string[];

  /**
   * Metadatos adicionales para la respuesta
   * @example { "ip_address": "192.168.1.1", "user_agent": "Mozilla/5.0..." }
   */
  @IsOptional()
  metadata?: Record<string, any>;
}
