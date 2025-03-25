import { IsString, IsEmail, IsOptional, IsEnum, IsObject, IsBoolean, IsPhoneNumber } from 'class-validator';
import { DataSubjectStatus } from './data-subject-status.enum';

/**
 * DTO para la creación de titulares de datos
 */
export class CreateDataSubjectDto {
  /**
   * Nombre completo del titular de datos
   * @example "Juan Pérez"
   */
  @IsString()
  fullName: string;

  /**
   * Correo electrónico del titular de datos
   * @example "juan.perez@example.com"
   */
  @IsEmail()
  email: string;

  /**
   * Número telefónico del titular de datos
   * @example "+56912345678"
   */
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  /**
   * ID de autenticación externa (si aplica)
   * @example "auth0|123456789"
   */
  @IsString()
  @IsOptional()
  externalId?: string;

  /**
   * ID de la compañía asociada (si aplica)
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsString()
  @IsOptional()
  companyId?: string;

  /**
   * Estado del titular de datos
   * @example "active"
   */
  @IsEnum(DataSubjectStatus)
  @IsOptional()
  status?: DataSubjectStatus = DataSubjectStatus.ACTIVE;

  /**
   * Indica si el titular de datos ha verificado su identidad
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  verified?: boolean = false;

  /**
   * Metadatos adicionales del titular de datos
   * @example { "preferences": { "language": "es", "notifications": true } }
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 