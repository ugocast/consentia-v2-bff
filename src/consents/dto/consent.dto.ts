import { ConsentStatus } from './index';

/**
 * DTO para la respuesta de consentimientos
 */
export class ConsentDto {
  /**
   * ID único del consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID del titular de los datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  dataSubjectId: string;

  /**
   * ID de la política legal asociada al consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  legalPolicyId: string;

  /**
   * ID de la solicitud de consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  consentRequestId: string;

  /**
   * Estado actual del consentimiento
   * @example "granted"
   */
  status: ConsentStatus;

  /**
   * Razón del estado actual (si aplica)
   * @example "El usuario ha decidido revocar su consentimiento"
   */
  reason?: string;

  /**
   * Metadatos adicionales del consentimiento
   * @example { "ip_address": "192.168.1.1", "user_agent": "Mozilla/5.0..." }
   */
  metadata?: Record<string, any>;

  /**
   * Fecha de creación del consentimiento
   * @example "2023-01-01T00:00:00.000Z"
   */
  createdAt: string;

  /**
   * Fecha de última actualización del consentimiento
   * @example "2023-01-01T00:00:00.000Z"
   */
  updatedAt: string;

  /**
   * Fecha de expiración del consentimiento (si aplica)
   * @example "2024-01-01T00:00:00.000Z"
   */
  expiresAt?: string;
}
