import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  IsOptional,
  IsEmail,
  IsDateString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ConsentChannel } from './consent-channel.enum';

/**
 * DTO para la creación de solicitudes de consentimiento
 */
export class CreateConsentRequestDto {
  /**
   * ID del sujeto de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'ID del sujeto de datos',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID(4, { message: 'El ID del sujeto de datos debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del sujeto de datos es requerido' })
  dataSubjectId: string;

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
   * ID de la política legal asociada
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'ID de la política legal asociada',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID(4, { message: 'El ID de la política legal debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la política legal es requerido' })
  legalPolicyId: string;

  /**
   * Propósito del consentimiento
   * @example "Envío de comunicaciones promocionales"
   */
  @ApiProperty({
    description: 'Propósito del consentimiento',
    example: 'Envío de comunicaciones promocionales'
  })
  @IsString({ message: 'El propósito debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El propósito es requerido' })
  purpose: string;

  /**
   * Canal de comunicación para la solicitud
   * @example "EMAIL"
   */
  @ApiProperty({
    description: 'Canal de comunicación para la solicitud',
    example: 'EMAIL',
    enum: ConsentChannel
  })
  @IsEnum(ConsentChannel, { message: 'El canal debe ser válido' })
  @IsNotEmpty({ message: 'El canal es requerido' })
  channel: ConsentChannel;

  /**
   * IDs de los tipos de datos asociados al consentimiento
   * @example ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174000"]
   */
  @ApiProperty({
    description: 'IDs de los tipos de datos asociados al consentimiento',
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000'],
    type: [String]
  })
  @IsArray({ message: 'Los tipos de datos deben ser un arreglo' })
  @IsUUID(4, { each: true, message: 'Cada ID de tipo de dato debe ser un UUID válido' })
  dataTypeIds: string[];

  /**
   * Fecha de expiración del consentimiento
   * @example "2024-01-01T00:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  /**
   * Metadatos adicionales del consentimiento
   * @example { "campaignId": "spring2023", "source": "website" }
   */
  @ApiPropertyOptional({
    description: 'Metadatos adicionales del consentimiento',
    example: { campaignId: 'spring2023', source: 'website' }
  })
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  @IsOptional()
  metadata?: Record<string, any>;
}
