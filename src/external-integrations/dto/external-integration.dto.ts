import { ExternalIntegrationStatus } from './external-integration-status.enum';

/**
 * DTO para la respuesta de integraciones externas
 */
export class ExternalIntegrationDto {
  /**
   * ID único de la integración
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID de la compañía a la que pertenece la integración
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  companyId: string;

  /**
   * Nombre de la integración
   * @example "Zendesk Integration"
   */
  name: string;

  /**
   * Tipo de integración
   * @example "CRM"
   */
  type: string;

  /**
   * URL del endpoint de la integración
   * @example "https://api.zendesk.com/v2/tickets"
   */
  endpoint: string;

  /**
   * Clave API para la integración
   * @example "apikey123456789"
   */
  apiKey: string;

  /**
   * Estado de la integración
   * @example "active"
   */
  status: ExternalIntegrationStatus;

  /**
   * Metadatos adicionales de la integración
   * @example { "webhookUrl": "https://example.com/webhook", "authType": "API_KEY" }
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

  /**
   * ID del usuario que creó la integración
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  createdBy: string;
} 