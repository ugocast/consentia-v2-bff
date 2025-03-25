import { ConsentStatus } from '../../consents/dto/consent-status.enum';

/**
 * DTO para el historial de consentimientos de un titular de datos
 */
export class ConsentHistoryDto {
  /**
   * ID único del consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID del titular de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  dataSubjectId: string;

  /**
   * ID de la política legal asociada
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  legalPolicyId: string;

  /**
   * Título de la política
   * @example "Política de Privacidad v1.2"
   */
  policyTitle: string;

  /**
   * Estado del consentimiento
   * @example "granted"
   */
  status: ConsentStatus;

  /**
   * Tipos de datos incluidos en el consentimiento
   * @example [{ "id": "123e4567-e89b-12d3-a456-426614174000", "name": "Email", "code": "EMAIL" }]
   */
  dataTypes: {
    id: string;
    name: string;
    code: string;
  }[];

  /**
   * Fecha en que se otorgó o actualizó el consentimiento
   * @example "2024-03-20T12:00:00Z"
   */
  actionDate: string;

  /**
   * Fecha de expiración del consentimiento (si aplica)
   * @example "2025-03-20T12:00:00Z"
   */
  expiryDate?: string;

  /**
   * Indica si el consentimiento está expirado
   * @example false
   */
  isExpired: boolean;
} 