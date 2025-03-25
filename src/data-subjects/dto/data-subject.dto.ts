import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataSubjectStatus } from './data-subject-status.enum';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, IsObject, IsISO8601 } from 'class-validator';

/**
 * DTO para la respuesta de titulares de datos
 */
export class DataSubjectDto {
  /**
   * ID único del titular de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({ description: 'ID único del titular de datos', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  /**
   * Nombre completo del titular de datos
   * @example "Juan Pérez"
   */
  @ApiProperty({ description: 'Nombre completo del titular de datos', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  /**
   * Correo electrónico del titular de datos
   * @example "juan.perez@example.com"
   */
  @ApiProperty({ description: 'Correo electrónico del titular de datos', example: 'juan.perez@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Número telefónico del titular de datos
   * @example "+56912345678"
   */
  @ApiPropertyOptional({ description: 'Número telefónico del titular de datos', example: '+56912345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  /**
   * ID de autenticación externa (si aplica)
   * @example "auth0|123456789"
   */
  @ApiPropertyOptional({ description: 'ID de autenticación externa', example: 'auth0|123456789' })
  @IsString()
  @IsOptional()
  externalId?: string;

  /**
   * ID de la compañía asociada (si aplica)
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiPropertyOptional({ description: 'ID de la compañía asociada', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  /**
   * Estado del titular de datos
   * @example "active"
   */
  @ApiProperty({ description: 'Estado del titular de datos', enum: DataSubjectStatus, example: DataSubjectStatus.ACTIVE })
  @IsEnum(DataSubjectStatus)
  @IsNotEmpty()
  status: DataSubjectStatus;

  /**
   * Indica si el titular de datos ha verificado su identidad
   * @example true
   */
  @ApiProperty({ description: 'Indica si el titular de datos ha verificado su identidad', example: true })
  @IsBoolean()
  verified: boolean;

  /**
   * Token de verificación (si aplica)
   * @example "abc123xyz456"
   */
  @ApiPropertyOptional({ description: 'Token de verificación', example: 'abc123xyz456' })
  @IsString()
  @IsOptional()
  verificationToken?: string;

  /**
   * Fecha de expiración del token de verificación
   * @example "2024-03-20T12:00:00Z"
   */
  @ApiPropertyOptional({ description: 'Fecha de expiración del token de verificación', example: '2024-03-20T12:00:00Z' })
  @IsISO8601()
  @IsOptional()
  verificationTokenExpiry?: string;

  /**
   * Token de acceso para el portal de autogestión
   * @example "abc123xyz456"
   */
  @ApiPropertyOptional({ description: 'Token de acceso para el portal de autogestión', example: 'abc123xyz456' })
  @IsString()
  @IsOptional()
  portalAccessToken?: string;

  /**
   * Fecha de expiración del token de acceso al portal
   * @example "2024-03-20T12:00:00Z"
   */
  @ApiPropertyOptional({ description: 'Fecha de expiración del token de acceso al portal', example: '2024-03-20T12:00:00Z' })
  @IsISO8601()
  @IsOptional()
  portalAccessTokenExpiry?: string;

  /**
   * Metadatos adicionales del titular de datos
   * @example { "preferences": { "language": "es", "notifications": true } }
   */
  @ApiPropertyOptional({ 
    description: 'Metadatos adicionales del titular de datos', 
    example: { preferences: { language: 'es', notifications: true } }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  /**
   * Fecha de último acceso al portal
   * @example "2024-03-20T12:00:00Z"
   */
  @ApiPropertyOptional({ description: 'Fecha de último acceso al portal', example: '2024-03-20T12:00:00Z' })
  @IsISO8601()
  @IsOptional()
  lastPortalAccess?: string;

  /**
   * Fecha de creación
   * @example "2024-03-20T12:00:00Z"
   */
  @ApiProperty({ description: 'Fecha de creación', example: '2024-03-20T12:00:00Z' })
  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;

  /**
   * Fecha de última actualización
   * @example "2024-03-20T12:00:00Z"
   */
  @ApiProperty({ description: 'Fecha de última actualización', example: '2024-03-20T12:00:00Z' })
  @IsISO8601()
  @IsNotEmpty()
  updatedAt: string;
} 