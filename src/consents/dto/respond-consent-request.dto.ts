import { IsBoolean, IsNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

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