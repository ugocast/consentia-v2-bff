import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Tipos de respuesta para una solicitud de consentimiento
 */
export enum ConsentResponse {
  GRANTED = 'GRANTED',
  REJECTED = 'REJECTED'
}

/**
 * DTO para responder a una solicitud de consentimiento
 */
export class RespondConsentRequestDto {
  /**
   * Respuesta a la solicitud: GRANTED (otorgado) o REJECTED (rechazado)
   * @example "GRANTED"
   */
  @ApiProperty({
    description: 'Respuesta a la solicitud: GRANTED (otorgado) o REJECTED (rechazado)',
    example: 'GRANTED',
    enum: ConsentResponse
  })
  @IsEnum(ConsentResponse, { message: 'La respuesta debe ser GRANTED o REJECTED' })
  @IsNotEmpty({ message: 'La respuesta es requerida' })
  response: ConsentResponse;

  /**
   * Motivo de la decisión (opcional)
   * @example "Acepto recibir comunicaciones promocionales"
   */
  @ApiPropertyOptional({
    description: 'Motivo de la decisión (opcional)',
    example: 'Acepto recibir comunicaciones promocionales'
  })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsOptional()
  reason?: string;
}
