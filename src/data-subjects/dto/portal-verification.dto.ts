import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para verificar el token de acceso al portal
 */
export class PortalVerificationRequestDto {
  /**
   * Token de acceso al portal
   * @example "38c3e5ca-4d2d-4b51-b5d0-99086c9a33ed"
   */
  @ApiProperty({
    description: 'Token de acceso al portal',
    example: '38c3e5ca-4d2d-4b51-b5d0-99086c9a33ed',
  })
  @IsString()
  @IsUUID()
  token: string;
}

/**
 * DTO para la verificación de acceso al portal de autogestión
 */
export class PortalVerificationDto {
  /**
   * Token de acceso para el portal
   * @example "abc123xyz456"
   */
  @ApiProperty({
    description: 'Token de acceso único generado y enviado por correo electrónico',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

/**
 * DTO para la respuesta de verificación de acceso al portal
 */
export class PortalVerificationResponseDto {
  /**
   * Indica si la verificación fue exitosa
   */
  @ApiProperty({
    description: 'Indica si la verificación fue exitosa',
    example: true,
  })
  success: boolean;

  /**
   * ID del titular de datos autenticado
   */
  @ApiProperty({
    description: 'ID del titular de datos autenticado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dataSubjectId: string;
} 