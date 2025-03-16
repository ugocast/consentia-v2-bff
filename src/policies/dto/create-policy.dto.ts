import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

/**
 * DTO para la creación de políticas legales
 */
export class CreatePolicyDto {
  /**
   * Título de la política
   * @example "Política de Privacidad"
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Contenido de la política
   * @example "Esta política de privacidad describe cómo recopilamos y utilizamos sus datos personales..."
   */
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * ID de la compañía a la que pertenece la política
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsNotEmpty()
  companyId: string;

  /**
   * Tipos de datos incluidos en la política
   * @example ["email", "nombre", "dirección"]
   */
  @IsArray()
  @IsOptional()
  dataTypes?: string[];
}
