import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { SubscriptionPlan } from './subscription-plan.enum';
import { BillingCycle } from './subscription-plan.dto';

/**
 * DTO para representar un registro en el historial de suscripciones.
 */
export class SubscriptionHistoryEntryDto {
  /**
   * Plan de suscripción.
   */
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  /**
   * Ciclo de facturación.
   */
  @IsEnum(BillingCycle)
  billing_cycle: BillingCycle;

  /**
   * Fecha de inicio de la suscripción.
   */
  @IsDateString()
  start_date: string;

  /**
   * Fecha de fin de la suscripción (null si está activa).
   */
  @IsDateString()
  @IsOptional()
  end_date?: string;
}

/**
 * DTO para respuesta con el historial completo de suscripciones de una empresa.
 */
export class SubscriptionHistoryDto {
  /**
   * Lista de entradas del historial de suscripciones.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionHistoryEntryDto)
  subscription_history: SubscriptionHistoryEntryDto[];
} 