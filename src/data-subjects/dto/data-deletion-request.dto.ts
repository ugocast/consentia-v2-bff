import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

/**
 * DTO para la solicitud de eliminación de datos
 */
export class DataDeletionRequestDto {
  /**
   * Motivo de la solicitud de eliminación
   * @example "Ya no deseo mantener mi cuenta activa"
   */
  @IsString()
  @IsOptional()
  reason?: string;

  /**
   * IDs de los tipos de datos específicos a eliminar (si es parcial)
   * @example ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174001"]
   */
  @IsArray()
  @IsOptional()
  dataTypeIds?: string[];

  /**
   * Indica si la eliminación es completa o parcial
   * @example true
   */
  @IsBoolean()
  isComplete: boolean = true;
} 