import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyStatus } from './company-status.enum';

/**
 * DTO para cambiar el estado de una empresa.
 */
export class ChangeCompanyStatusDto {
  /**
   * Nuevo estado para la empresa.
   */
  @IsEnum(CompanyStatus)
  status: CompanyStatus;

  /**
   * Razón opcional del cambio de estado.
   */
  @IsString()
  @IsOptional()
  reason?: string;
} 