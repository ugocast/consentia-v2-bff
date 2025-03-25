import { IsDate, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from './subscription-plan.enum';

/**
 * Enum para ciclos de facturación.
 */
export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

/**
 * DTO para los detalles de facturación.
 */
export class BillingDetailsDto {
  /**
   * Método de pago.
   */
  @IsString()
  payment_method: string;

  /**
   * Email para facturación.
   */
  @IsString()
  billing_email: string;

  /**
   * Dirección para facturación.
   */
  @IsString()
  @IsOptional()
  billing_address?: string;
}

/**
 * DTO para actualizar el plan de suscripción de una empresa.
 */
export class SubscriptionPlanDto {
  /**
   * Plan de suscripción.
   */
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  /**
   * Ciclo de facturación.
   */
  @IsEnum(BillingCycle)
  @IsOptional()
  billing_cycle?: BillingCycle = BillingCycle.MONTHLY;

  /**
   * Fecha de inicio.
   */
  @IsDate()
  @IsOptional()
  start_date?: Date;

  /**
   * Fecha de fin.
   */
  @IsDate()
  @IsOptional()
  end_date?: Date;

  /**
   * Detalles de facturación.
   */
  @IsObject()
  @IsOptional()
  billing_details?: BillingDetailsDto;
} 