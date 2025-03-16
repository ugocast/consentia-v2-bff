import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

/**
 * DTO para la actualización de políticas legales
 */
export class UpdatePolicyDto {
  /**
   * Título de la política
   * @example "Política de Privacidad Actualizada"
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Contenido de la política
   * @example "Esta política de privacidad actualizada describe cómo recopilamos y utilizamos sus datos personales..."
   */
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * Tipos de datos incluidos en la política
   * @example ["email", "nombre", "dirección", "teléfono"]
   */
  @IsArray()
  @IsOptional()
  dataTypes?: string[];
}
