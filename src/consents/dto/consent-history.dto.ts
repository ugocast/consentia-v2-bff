import { ApiProperty } from '@nestjs/swagger';
import { ConsentStatus } from './consent-status.enum';

/**
 * DTO para representar un elemento en el historial de consentimientos
 */
export class ConsentHistoryDto {
  @ApiProperty({
    description: 'ID del consentimiento',
    example: 'e7c1b6e0-7c1e-4b1e-8c1b-6e07c1e4b1e8'
  })
  id: string;

  @ApiProperty({
    description: 'ID del titular de datos',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6'
  })
  dataSubjectId: string;

  @ApiProperty({
    description: 'ID de la política legal asociada',
    example: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7'
  })
  legalPolicyId: string;

  @ApiProperty({
    description: 'Título de la política',
    example: 'Política de Privacidad'
  })
  policyTitle: string;

  @ApiProperty({
    description: 'Versión de la política',
    example: '1.0.0'
  })
  policyVersion: string;

  @ApiProperty({
    description: 'Fecha de validez de la política',
    example: '2023-01-01T00:00:00.000Z'
  })
  policyDate: string;

  @ApiProperty({
    description: 'Propósito del consentimiento',
    example: 'Marketing por email'
  })
  purpose: string;

  @ApiProperty({
    description: 'Estado actual del consentimiento',
    enum: ConsentStatus,
    example: ConsentStatus.GRANTED
  })
  status: ConsentStatus;

  @ApiProperty({
    description: 'Detalles adicionales sobre el estado (ej. razón de rechazo)',
    example: 'No deseo recibir correos promocionales'
  })
  statusDetails?: string;

  @ApiProperty({
    description: 'Tipos de datos asociados al consentimiento',
    example: [
      { id: 'c3d4e5f6', name: 'Email', code: 'EMAIL' },
      { id: 'd4e5f6g7', name: 'Teléfono', code: 'PHONE' }
    ],
    isArray: true,
    type: 'object'
  })
  dataTypes: Array<{
    id: string;
    name: string;
    code: string;
  }>;

  @ApiProperty({
    description: 'Fecha de la acción (otorgamiento, revocación, etc.)',
    example: '2023-01-15T14:30:00.000Z'
  })
  actionDate: string;

  @ApiProperty({
    description: 'Fecha de expiración del consentimiento',
    example: '2024-01-15T14:30:00.000Z'
  })
  expiryDate?: string;

  @ApiProperty({
    description: 'Indica si el consentimiento ha expirado',
    example: false
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Canal por el que se obtuvo el consentimiento',
    example: 'EMAIL'
  })
  channel: string;
} 