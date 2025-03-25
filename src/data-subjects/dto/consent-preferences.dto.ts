import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentStatus } from '../../consents/dto/consent-status.enum';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para los tipos de datos asociados a un consentimiento
 */
export class ConsentDataTypeDto {
  /**
   * ID único del tipo de dato
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID único del tipo de dato', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  /**
   * Nombre del tipo de dato
   * @example "Email"
   */
  @ApiProperty({ description: 'Nombre del tipo de dato', example: 'Email' })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Código del tipo de dato
   * @example "EMAIL"
   */
  @ApiProperty({ description: 'Código del tipo de dato', example: 'EMAIL' })
  @IsString()
  @IsNotEmpty()
  code: string;

  /**
   * Descripción del tipo de dato
   * @example "Dirección de correo electrónico"
   */
  @ApiPropertyOptional({ description: 'Descripción del tipo de dato', example: 'Dirección de correo electrónico' })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO para una preferencia de consentimiento
 */
export class ConsentPreferenceDto {
  /**
   * ID único del consentimiento
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID único del consentimiento', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  /**
   * ID de la política legal asociada
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID de la política legal asociada', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  legalPolicyId: string;

  /**
   * Título de la política
   * @example "Política de Privacidad v1.2"
   */
  @ApiProperty({ description: 'Título de la política', example: 'Política de Privacidad v1.2' })
  @IsString()
  @IsNotEmpty()
  policyTitle: string;

  /**
   * Descripción corta de la política
   * @example "Consentimiento para el uso de datos personales"
   */
  @ApiProperty({ description: 'Descripción corta de la política', example: 'Consentimiento para el uso de datos personales' })
  @IsString()
  @IsNotEmpty()
  policyDescription: string;

  /**
   * Estado actual del consentimiento
   * @example "granted"
   */
  @ApiProperty({ description: 'Estado actual del consentimiento', enum: ConsentStatus, example: ConsentStatus.GRANTED })
  @IsEnum(ConsentStatus)
  @IsNotEmpty()
  status: ConsentStatus;

  /**
   * Fecha de la última actualización del consentimiento
   * @example "2024-03-20T12:00:00Z"
   */
  @ApiProperty({ description: 'Fecha de la última actualización del consentimiento', example: '2024-03-20T12:00:00Z' })
  @IsISO8601()
  @IsNotEmpty()
  lastUpdated: string;
  
  /**
   * Indica si el consentimiento es obligatorio
   * @example false
   */
  @ApiProperty({ description: 'Indica si el consentimiento es obligatorio', example: false })
  @IsBoolean()
  isMandatory: boolean;

  /**
   * Fecha de expiración del consentimiento (si aplica)
   * @example "2025-03-20T12:00:00Z"
   */
  @ApiPropertyOptional({ description: 'Fecha de expiración del consentimiento', example: '2025-03-20T12:00:00Z' })
  @IsISO8601()
  @IsOptional()
  expiryDate?: string;

  /**
   * Tipos de datos asociados al consentimiento
   */
  @ApiProperty({ 
    description: 'Tipos de datos asociados al consentimiento',
    type: [ConsentDataTypeDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsentDataTypeDto)
  dataTypes: ConsentDataTypeDto[];
}

/**
 * DTO para las preferencias actuales de consentimientos de un titular de datos
 */
export class ConsentPreferencesDto {
  /**
   * ID único del titular de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID único del titular de datos', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  dataSubjectId: string;

  /**
   * Email del titular de datos
   * @example "usuario@ejemplo.com"
   */
  @ApiProperty({ description: 'Email del titular de datos', example: 'usuario@ejemplo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Lista de preferencias de consentimiento actuales
   */
  @ApiProperty({ 
    description: 'Lista de preferencias de consentimiento actuales',
    type: [ConsentPreferenceDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsentPreferenceDto)
  preferences: ConsentPreferenceDto[];

  /**
   * Fecha de la última actualización de preferencias
   * @example "2024-03-20T12:00:00Z"
   */
  @ApiProperty({ description: 'Fecha de la última actualización de preferencias', example: '2024-03-20T12:00:00Z' })
  @IsISO8601()
  @IsNotEmpty()
  lastUpdated: string;
} 