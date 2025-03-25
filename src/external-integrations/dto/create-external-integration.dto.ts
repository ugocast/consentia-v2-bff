import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl, IsObject } from 'class-validator';
import { ExternalIntegrationStatus } from './external-integration-status.enum';

/**
 * DTO para la creación de integraciones externas
 */
export class CreateExternalIntegrationDto {
  /**
   * Nombre de la integración
   * @example "Zendesk Integration"
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Tipo de integración
   * @example "CRM"
   */
  @IsString()
  @IsNotEmpty()
  type: string;

  /**
   * URL del endpoint de la integración
   * @example "https://api.zendesk.com/v2/tickets"
   */
  @IsUrl()
  @IsNotEmpty()
  endpoint: string;

  /**
   * Clave API para la integración
   * @example "apikey123456789"
   */
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  /**
   * Estado de la integración
   * @example "active"
   */
  @IsEnum(ExternalIntegrationStatus)
  @IsOptional()
  status?: ExternalIntegrationStatus = ExternalIntegrationStatus.ACTIVE;

  /**
   * Metadatos adicionales de la integración
   * @example { "webhookUrl": "https://example.com/webhook", "authType": "API_KEY" }
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 