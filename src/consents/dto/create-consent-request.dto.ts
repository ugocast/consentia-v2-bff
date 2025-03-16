import { IsString, IsNotEmpty, IsUUID, IsArray, IsOptional, IsEmail } from 'class-validator';

/**
 * DTO para la creación de solicitudes de consentimiento
 */
export class CreateConsentRequestDto {
  /**
   * Email del titular de los datos
   * @example "usuario@ejemplo.com"
   */
  @IsEmail()
  @IsNotEmpty()
  dataSubjectEmail: string;

  /**
   * Nombre del titular de los datos
   * @example "Juan Pérez"
   */
  @IsString()
  @IsNotEmpty()
  dataSubjectName: string;

  /**
   * ID de la política legal asociada al consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsUUID(4)
  @IsNotEmpty()
  legalPolicyId: string;

  /**
   * IDs de los tipos de datos incluidos en la solicitud
   * @example ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174000"]
   */
  @IsArray()
  @IsUUID(4, { each: true })
  @IsNotEmpty()
  dataTypeIds: string[];

  /**
   * Metadatos adicionales para la solicitud
   * @example { "source": "formulario_web", "campaign": "promo_verano" }
   */
  @IsOptional()
  metadata?: Record<string, any>;
} 