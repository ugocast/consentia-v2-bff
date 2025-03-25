import { IsOptional, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para actualizar una operación masiva
 * @example
 * {
 *   "items": [
 *     {
 *       "id": "123e4567-e89b-12d3-a456-426614174000",
 *       "status": "completed",
 *       "metadata": {
 *         "processed_at": "2024-03-24T12:00:00Z"
 *       }
 *     }
 *   ]
 * }
 */
export class UpdateBulkOperationDto {
  /**
   * Lista de elementos actualizados
   * @example [{ "id": "123e4567-e89b-12d3-a456-426614174000" }]
   */
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  items?: any[];

  /**
   * Metadatos adicionales de la operación
   * @example { "processed_at": "2024-03-24T12:00:00Z" }
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 