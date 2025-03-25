import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CompanyUserStatus } from './company-user-status.enum';

/**
 * DTO para cambiar el estado de un usuario de compañía
 */
export class ChangeUserStatusDto {
  /**
   * Nuevo estado para el usuario
   * @example "active"
   */
  @IsEnum(CompanyUserStatus)
  @IsNotEmpty()
  status: CompanyUserStatus;

  /**
   * Razón del cambio de estado
   * @example "Usuario reactivado tras resolver problemas de pago"
   */
  @IsString()
  @IsOptional()
  reason?: string;
} 