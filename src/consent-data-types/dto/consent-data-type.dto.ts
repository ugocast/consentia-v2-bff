import { ConsentDataTypeStatus } from './consent-data-type-status.enum';

/**
 * DTO para la respuesta de tipos de datos de consentimiento
 */
export class ConsentDataTypeDto {
  /**
   * ID único del tipo de dato de consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID del consentimiento al que pertenece el tipo de dato
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  consentId: string;

  /**
   * ID del tipo de dato
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  dataTypeId: string;

  /**
   * Estado del tipo de dato de consentimiento
   * @example "active"
   */
  status: ConsentDataTypeStatus;

  /**
   * Metadatos adicionales del tipo de dato de consentimiento
   * @example { "retentionPeriod": "1y", "processingPurpose": "marketing" }
   */
  metadata?: Record<string, any>;

  /**
   * Fecha de creación
   * @example "2024-03-20T12:00:00Z"
   */
  createdAt: string;

  /**
   * Fecha de última actualización
   * @example "2024-03-20T12:00:00Z"
   */
  updatedAt: string;
} 