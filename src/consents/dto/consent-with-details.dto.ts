import { ConsentDto } from './consent.dto';
import { PolicyDto } from '../../policies/dto';
import { ConsentStatus } from './consent-status.enum';

/**
 * DTO para la respuesta detallada de consentimientos
 */
export class ConsentWithDetailsDto {
  /**
   * ID único del consentimiento o de la solicitud
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID de la empresa
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  companyId?: string;

  /**
   * Estado del consentimiento o de la solicitud
   * @example "PENDING", "GRANTED", "DENIED"
   */
  status: string;

  /**
   * Propósito del consentimiento
   * @example "Envío de comunicaciones promocionales"
   */
  purpose?: string;

  /**
   * Canal de comunicación utilizado para la solicitud
   * @example "EMAIL"
   */
  channel?: string;

  /**
   * Fecha de creación
   * @example "2023-01-01T00:00:00.000Z"
   */
  createdAt: string;

  /**
   * Fecha de última actualización
   * @example "2023-01-01T00:00:00.000Z"
   */
  updatedAt: string;

  /**
   * Fecha de expiración
   * @example "2023-01-01T00:00:00.000Z"
   */
  expiresAt?: string;

  /**
   * Metadatos adicionales
   * @example { "browser": "Chrome", "device": "Mobile" }
   */
  metadata?: Record<string, any>;

  /**
   * Detalles del titular de los datos
   */
  dataSubject?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    name?: string;
  };

  /**
   * Detalles de la política legal
   */
  legalPolicy?: {
    id: string;
    title: string;
    content: string;
    version?: number;
    validFrom?: string;
    validTo?: string | null;
    dataTypes?: any[];
    status?: string;
    metadata?: Record<string, any>;
    companyId?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  /**
   * Tipos de datos incluidos en el consentimiento
   */
  dataTypes?: Array<{
    id: string;
    name: string;
    code?: string;
    description?: string;
    category?: string;
    isRequired?: boolean;
  }>;

  /**
   * Token único de la solicitud (para acceso público)
   * @example "a1b2c3d4e5f6g7h8i9j0"
   */
  token?: string;
}
