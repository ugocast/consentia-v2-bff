import { IsEmail, IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para la solicitud de acceso al portal de autogestión
 */
export class PortalAccessRequestDto {
  /**
   * Correo electrónico del titular de datos
   * @example "juan.perez@example.com"
   */
  @ApiProperty({
    description: 'Correo electrónico del titular de datos',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  email: string;

  /**
   * URL base del frontend para construir el enlace del portal (opcional)
   * @example "https://app.consentia.io"
   */
  @ApiPropertyOptional({
    description: 'URL base del frontend para construir el enlace del portal (opcional)',
    example: 'https://app.consentia.io',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  frontendPortalUrl?: string;
} 