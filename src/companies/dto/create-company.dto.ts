import { IsString, IsEmail, IsOptional, IsEnum, IsObject } from 'class-validator';
import { SubscriptionPlan } from './subscription-plan.enum';
import { CompanyStatus } from './company-status.enum';

/**
 * DTO para la creación de una nueva empresa.
 */
export class CreateCompanyDto {
  /**
   * Nombre de la empresa. Requerido.
   */
  @IsString()
  name: string;

  /**
   * Descripción de la empresa. Opcional.
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Email de contacto de la empresa. Requerido.
   */
  @IsEmail()
  contact_email: string;

  /**
   * Teléfono de contacto. Opcional.
   */
  @IsString()
  @IsOptional()
  phone?: string;

  /**
   * Dirección de la empresa. Opcional.
   */
  @IsString()
  @IsOptional()
  address?: string;

  /**
   * Estado inicial de la empresa. Por defecto es TRIAL.
   */
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus = CompanyStatus.TRIAL;

  /**
   * Plan de suscripción inicial. Por defecto es FREE.
   */
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscription_plan?: SubscriptionPlan = SubscriptionPlan.FREE;

  /**
   * Metadatos adicionales de la empresa. Opcional.
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 