import { IsArray, IsOptional, IsString } from 'class-validator';

/**
 * DTO para solicitudes de acceso a datos personales
 */
export class DataAccessRequestDto {
  /**
   * Motivo de la solicitud de acceso (opcional)
   * @example "Verificación de información almacenada"
   */
  @IsString()
  @IsOptional()
  reason?: string;

  /**
   * IDs específicos de tipos de datos a los que se solicita acceso (opcional)
   * Si no se especifica, se entenderá que solicita acceso a todos los datos disponibles
   * @example ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174111"]
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dataTypeIds?: string[];
} 