import { IsEnum, IsObject, IsArray, IsOptional, IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para crear una operación masiva
 * @example
 * {
 *   "type": "create_consent",
 *   "items": [
 *     {
 *       "dataSubjectId": "123e4567-e89b-12d3-a456-426614174000",
 *       "legalPolicyId": "123e4567-e89b-12d3-a456-426614174001",
 *       "metadata": {
 *         "ip_address": "192.168.1.1",
 *         "user_agent": "Mozilla/5.0..."
 *       }
 *     }
 *   ]
 * }
 */
export class CreateBulkOperationDto {
  /**
   * Tipo de operación masiva a realizar
   * @example "create_consent"
   */
  @IsEnum(['create_consent', 'update_consent', 'revoke_consent', 'delete_consent', 'EXPORT_CONSENT', 'IMPORT_CONSENT', 'USER_IMPORT', 'USER_EXPORT', 'CONSENT_IMPORT', 'CONSENT_EXPORT', 'DATA_TYPE_IMPORT', 'DATA_TYPE_EXPORT', 'COMPANY_CONFIG_IMPORT', 'COMPANY_CONFIG_EXPORT'])
  @IsNotEmpty()
  type: 'create_consent' | 'update_consent' | 'revoke_consent' | 'delete_consent' | 'EXPORT_CONSENT' | 'IMPORT_CONSENT' | 'USER_IMPORT' | 'USER_EXPORT' | 'CONSENT_IMPORT' | 'CONSENT_EXPORT' | 'DATA_TYPE_IMPORT' | 'DATA_TYPE_EXPORT' | 'COMPANY_CONFIG_IMPORT' | 'COMPANY_CONFIG_EXPORT';

  /**
   * Lista de elementos a procesar en la operación masiva
   * @example [{ "dataSubjectId": "123e4567-e89b-12d3-a456-426614174000" }]
   */
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Object)
  items: any[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  description?: string;
} 