import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { AuditAction } from '../enums/audit-action.enum';
import { ResourceType } from '../enums/resource-type.enum';

/**
 * DTO para un registro de auditoría
 * @example
 * {
 *   "action": "create_consent",
 *   "resourceType": "consent",
 *   "resourceId": "123e4567-e89b-12d3-a456-426614174000",
 *   "userId": "user123",
 *   "metadata": {
 *     "ip_address": "192.168.1.1",
 *     "user_agent": "Mozilla/5.0..."
 *   },
 *   "timestamp": "2024-03-24T12:00:00Z"
 * }
 */
export class AuditLogDto {
  /**
   * Acción realizada
   * @example "create_consent"
   */
  @IsEnum(AuditAction)
  action: AuditAction;

  /**
   * Tipo de recurso afectado
   * @example "consent"
   */
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  /**
   * ID del recurso afectado
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsString()
  resourceId: string;

  /**
   * ID del usuario que realizó la acción
   * @example "user123"
   */
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * ID del recurso anterior (en caso de actualizaciones)
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsString()
  @IsOptional()
  previousResourceId?: string;

  /**
   * Metadatos adicionales de la acción
   * @example { "ip_address": "192.168.1.1" }
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  /**
   * Dirección IP del usuario
   * @example "192.168.1.1"
   */
  @IsString()
  @IsOptional()
  ipAddress?: string;

  /**
   * User Agent del navegador
   * @example "Mozilla/5.0..."
   */
  @IsString()
  @IsOptional()
  userAgent?: string;

  /**
   * Fecha y hora de la acción
   * @example "2024-03-24T12:00:00Z"
   */
  @IsString()
  @IsOptional()
  timestamp?: string;
} 