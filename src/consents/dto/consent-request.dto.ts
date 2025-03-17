/**
 * DTO para la respuesta de solicitudes de consentimiento
 */
export class ConsentRequestDto {
  /**
   * ID único de la solicitud de consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID del titular de los datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  dataSubjectId: string;

  /**
   * ID de la política legal asociada a la solicitud
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  legalPolicyId: string;

  /**
   * ID de la compañía que solicita el consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  companyId: string;

  /**
   * Estado de la solicitud (pendiente, respondida, expirada)
   * @example "PENDING"
   */
  status: string;

  /**
   * Fecha de expiración de la solicitud
   * @example "2023-12-31T23:59:59.999Z"
   */
  expiresAt?: string;

  /**
   * Metadatos adicionales de la solicitud
   * @example { "source": "formulario_web", "campaign": "promo_verano" }
   */
  metadata?: Record<string, any>;

  /**
   * Fecha de creación de la solicitud
   * @example "2023-01-01T00:00:00.000Z"
   */
  createdAt: string;

  /**
   * Fecha de última actualización de la solicitud
   * @example "2023-01-01T00:00:00.000Z"
   */
  updatedAt: string;
}
