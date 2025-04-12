import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '../../companies/dto';

/**
 * DTO para crear una empresa por un usuario registrado
 */
export class CreateUserCompanyDto {
  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Mi Empresa S.A.'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción de la empresa',
    example: 'Empresa dedicada a la gestión de consentimientos',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Email de contacto de la empresa',
    example: 'contacto@miempresa.com'
  })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({
    description: 'Teléfono de contacto de la empresa',
    example: '+34 123 456 789',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Dirección de la empresa',
    example: 'Calle Principal 123, Ciudad',
    required: false
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Plan de suscripción de la empresa',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.FREE,
    required: false
  })
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlan = SubscriptionPlan.FREE;

  @ApiProperty({
    description: 'Metadatos adicionales de la empresa',
    required: false,
    example: {
      industry: 'Tecnología',
      size: 'Pequeña'
    }
  })
  @IsOptional()
  metadata?: Record<string, any>;
} 