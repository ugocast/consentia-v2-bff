/**
 * DTO que representa una operación masiva
 * @example
 * {
 *   "id": "123e4567-e89b-12d3-a456-426614174000",
 *   "type": "create_consent",
 *   "items": [...],
 *   "status": "pending",
 *   "created_at": "2024-03-24T12:00:00Z",
 *   "created_by": "user123",
 *   "company_id": "company123"
 * }
 */
export class BulkOperationDto {
  /**
   * ID único de la operación masiva
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * Tipo de operación masiva
   * @example "create_consent"
   */
  type: 'create_consent' | 'update_consent' | 'revoke_consent' | 'delete_consent' | 'EXPORT_CONSENT' | 'IMPORT_CONSENT' | 'USER_IMPORT' | 'USER_EXPORT' | 'CONSENT_IMPORT' | 'CONSENT_EXPORT' | 'DATA_TYPE_IMPORT' | 'DATA_TYPE_EXPORT' | 'COMPANY_CONFIG_IMPORT' | 'COMPANY_CONFIG_EXPORT';

  /**
   * Lista de elementos a procesar
   * @example [{ "dataSubjectId": "123e4567-e89b-12d3-a456-426614174000" }]
   */
  items: any[];

  /**
   * Estado actual de la operación
   * @example "pending"
   */
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

  /**
   * Fecha de creación de la operación
   * @example "2024-03-24T12:00:00Z"
   */
  created_at: string;

  /**
   * ID del usuario que creó la operación
   * @example "user123"
   */
  created_by: string;

  /**
   * ID de la compañía que realiza la operación
   * @example "company123"
   */
  company_id: string;

  /**
   * Fecha de última actualización de la operación
   * @example "2024-03-24T12:00:00Z"
   */
  updated_at?: string;

  /**
   * ID del usuario que actualizó la operación
   * @example "user123"
   */
  updated_by?: string;

  /**
   * Fecha de finalización de la operación
   * @example "2024-03-24T12:00:00Z"
   */
  completed_at?: string;

  /**
   * Mensaje de error si la operación falló
   * @example "Error al procesar el consentimiento"
   */
  error_message?: string;

  /**
   * Metadatos adicionales de la operación
   * @example { "processed_at": "2024-03-24T12:00:00Z" }
   */
  metadata?: Record<string, any>;

  /**
   * Comentarios sobre la operación
   * @example "Procesamiento por lotes programado para datos de consentimiento actualizados"
   */
  comments?: string;
} 