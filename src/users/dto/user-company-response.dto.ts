import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '../../companies/dto';

/**
 * DTO de respuesta para la creación de empresa por usuario registrado
 */
export class UserCompanyResponseDto {
  @ApiProperty({
    description: 'Estado de la operación',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Empresa creada correctamente'
  })
  message: string;

  @ApiProperty({
    description: 'ID de la empresa creada',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  companyId: string;

  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Mi Empresa S.A.'
  })
  companyName: string;

  @ApiProperty({
    description: 'Plan de suscripción de la empresa',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.FREE
  })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({
    description: 'ID del usuario en la empresa (company_user)',
    example: '789e0123-e45b-67d8-a90b-123456789000'
  })
  companyUserId: string;

  @ApiProperty({
    description: 'Rol del usuario en la empresa',
    example: 'ADMINISTRATOR'
  })
  role: string;
} 