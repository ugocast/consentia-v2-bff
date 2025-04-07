import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum para el estado de las claves API
 */
export enum ApiKeyStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

/**
 * DTO para representar una clave API
 */
export class ApiKeyDto {
  @ApiProperty({
    description: 'Identificador único de la clave API',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la clave API',
    example: 'Integración con CRM'
  })
  name: string;

  @ApiProperty({
    description: 'Valor de la clave API (solo se muestra al crearla)',
    example: 'sk_test_abcdefghijklmnopqrstuvwxyz',
    required: false
  })
  key?: string;

  @ApiProperty({
    description: 'ID de la empresa a la que pertenece la clave',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  companyId: string;

  @ApiProperty({
    description: 'ID del usuario que creó la clave',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Estado actual de la clave API',
    enum: ApiKeyStatus,
    example: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Fecha de expiración (opcional)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  expiresAt?: string;
} 