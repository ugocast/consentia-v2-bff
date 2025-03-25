import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PersonalDataValue } from './data-access-response.dto';

/**
 * DTO para un dato a rectificar
 */
export class RectificationItemDto {
  /**
   * ID del tipo de dato a rectificar
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsString()
  @IsNotEmpty()
  dataTypeId: string;

  /**
   * Valor actual del dato (opcional, para referencia)
   * @example "usuario@antiguodominio.com"
   */
  @IsOptional()
  currentValue?: PersonalDataValue;

  /**
   * Nuevo valor que debe reemplazar al actual
   * @example "usuario@nuevodominio.com"
   */
  @IsNotEmpty()
  newValue: PersonalDataValue;

  /**
   * Razón de la rectificación (opcional)
   * @example "Cambio de dirección de correo electrónico"
   */
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * DTO para solicitudes de rectificación de datos personales
 */
export class DataRectificationRequestDto {
  /**
   * Motivo general de la solicitud de rectificación (opcional)
   * @example "Actualización de información personal"
   */
  @IsString()
  @IsOptional()
  reason?: string;

  /**
   * Lista de datos a rectificar
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RectificationItemDto)
  @IsNotEmpty()
  items: RectificationItemDto[];
} 