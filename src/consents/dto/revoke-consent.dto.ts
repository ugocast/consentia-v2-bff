import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO para revocar un consentimiento
 */
export class RevokeConsentDto {
  /**
   * Motivo de la revocación (opcional)
   * @example "Ya no deseo recibir comunicaciones promocionales"
   */
  @ApiPropertyOptional({
    description: 'Motivo de la revocación (opcional)',
    example: 'Ya no deseo recibir comunicaciones promocionales'
  })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsOptional()
  reason?: string;
} 