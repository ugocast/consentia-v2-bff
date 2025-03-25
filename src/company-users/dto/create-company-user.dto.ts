import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional, IsObject } from 'class-validator';
import { CompanyUserStatus } from './company-user-status.enum';
import { CompanyUserRole } from './company-user-role.enum';

/**
 * DTO para la creación de usuarios de compañía
 */
export class CreateCompanyUserDto {
  /**
   * ID de autenticación del usuario
   * @example "auth0|123456789"
   */
  @IsString()
  @IsNotEmpty()
  authId: string;

  /**
   * Nombre completo del usuario
   * @example "Juan Pérez"
   */
  @IsString()
  @IsNotEmpty()
  fullName: string;

  /**
   * Correo electrónico del usuario
   * @example "juan.perez@company.com"
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Rol del usuario en la compañía
   * @example "admin"
   */
  @IsEnum(CompanyUserRole)
  @IsNotEmpty()
  role: CompanyUserRole;

  /**
   * Estado del usuario en la compañía
   * @example "active"
   */
  @IsEnum(CompanyUserStatus)
  @IsOptional()
  status?: CompanyUserStatus = CompanyUserStatus.ACTIVE;

  /**
   * Metadatos adicionales del usuario
   * @example { "preferences": { "language": "es", "notifications": true } }
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 