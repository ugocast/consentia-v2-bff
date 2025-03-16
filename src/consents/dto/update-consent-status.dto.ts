import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ConsentStatus } from './consent-status.enum';

/**
 * DTO para actualizar el estado de un consentimiento
 */
export class UpdateConsentStatusDto {
  /**
   * Nuevo estado del consentimiento
   * @example "revoked"
   */
  @IsEnum(ConsentStatus)
  @IsNotEmpty()
  status: ConsentStatus;

  /**
   * Razón del cambio de estado
   * @example "El usuario ha decidido revocar su consentimiento"
   */
  @IsString()
  @IsOptional()
  reason?: string;

  /**
   * Metadatos adicionales para el cambio de estado
   * @example { "ip_address": "192.168.1.1", "user_agent": "Mozilla/5.0..." }
   */
  @IsOptional()
  metadata?: Record<string, any>;
}
