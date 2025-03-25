import { ApiProperty } from '@nestjs/swagger';
import { ConsentStatus } from './consent-status.enum';

/**
 * DTO para respuestas generales de consentimientos
 */
export class ConsentResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Operación completada exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID del consentimiento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}

/**
 * DTO para respuestas de actualización de estado de consentimientos
 */
export class ConsentStatusResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Estado de consentimiento actualizado',
  })
  message: string;

  @ApiProperty({
    description: 'ID del consentimiento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Estado anterior del consentimiento',
    example: 'pending',
    enum: ConsentStatus,
  })
  previousStatus: ConsentStatus;

  @ApiProperty({
    description: 'Estado actual del consentimiento',
    example: 'approved',
    enum: ConsentStatus,
  })
  currentStatus: ConsentStatus;

  @ApiProperty({
    description: 'Timestamp de la actualización',
    example: '2023-01-01T12:00:00Z',
  })
  updatedAt: string;
}

/**
 * DTO para respuestas de creación de solicitudes de consentimiento
 */
export class ConsentRequestResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Solicitud de consentimiento creada',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la solicitud de consentimiento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestId: string;

  @ApiProperty({
    description: 'URL para responder a la solicitud',
    example: 'https://ejemplo.com/consents/respond/123e4567-e89b-12d3-a456-426614174000',
  })
  responseUrl?: string;

  @ApiProperty({
    description: 'Fecha de expiración de la solicitud',
    example: '2023-01-15T12:00:00Z',
  })
  expiresAt?: string;
}

/**
 * DTO para respuestas a solicitudes de consentimiento
 */
export class ConsentRequestAnswerResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Respuesta a solicitud de consentimiento registrada',
  })
  message: string;

  @ApiProperty({
    description: 'ID del consentimiento creado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  consentId: string;

  @ApiProperty({
    description: 'Decisión tomada sobre el consentimiento',
    example: 'approved',
    enum: ConsentStatus,
  })
  decision: ConsentStatus;

  @ApiProperty({
    description: 'Timestamp de la respuesta',
    example: '2023-01-01T12:00:00Z',
  })
  respondedAt: string;
} 