import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CompanyUserRole } from './company-user-role.enum';

/**
 * DTO para cambiar el rol de un usuario de compañía
 */
export class ChangeUserRoleDto {
  /**
   * Nuevo rol para el usuario
   * @example "manager"
   */
  @IsEnum(CompanyUserRole)
  @IsNotEmpty()
  role: CompanyUserRole;

  /**
   * Justificación del cambio de rol
   * @example "Promoción a manager por desempeño destacado"
   */
  @IsString()
  @IsOptional()
  justification?: string;
} 