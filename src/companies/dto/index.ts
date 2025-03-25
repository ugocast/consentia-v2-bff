import { IsString, IsEmail, IsOptional, IsEnum, IsObject, IsDate } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export enum SubscriptionPlan {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  contact_email: string;
  phone?: string;
  address?: string;
  subscription_plan: SubscriptionPlan;
  metadata?: Record<string, any>;
  config?: {
    notification_settings?: {
      email_notifications: boolean;
      sms_notifications: boolean;
      notification_frequency: string;
    };
    privacy_settings?: {
      data_retention_period: number;
      allow_data_sharing: boolean;
      require_explicit_consent: boolean;
    };
    branding_settings?: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
    };
  };
  subscription_details?: {
    start_date?: string;
    end_date?: string;
    billing_details?: {
      payment_method: string;
      billing_email: string;
      billing_address: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEmail()
  contact_email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscription_plan?: SubscriptionPlan = SubscriptionPlan.FREE;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyConfigDto {
  @IsObject()
  @IsOptional()
  notification_settings?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    notification_frequency: string;
  };

  @IsObject()
  @IsOptional()
  privacy_settings?: {
    data_retention_period: number;
    allow_data_sharing: boolean;
    require_explicit_consent: boolean;
  };

  @IsObject()
  @IsOptional()
  branding_settings?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

export class SubscriptionPlanDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsDate()
  @IsOptional()
  start_date?: Date;

  @IsDate()
  @IsOptional()
  end_date?: Date;

  @IsOptional()
  billing_details?: {
    payment_method: string;
    billing_email: string;
    billing_address: string;
  };
}

// Exportar enums
export * from './company-status.enum';
export * from './subscription-plan.enum';

// Exportar DTOs
export * from './company.interface';
export * from './create-company.dto';
export * from './update-company.dto';
export * from './company-config.dto';
export * from './subscription-plan.dto';
export * from './subscription-history.dto';
export * from './standard-response.dto';
export * from './change-company-status.dto'; 