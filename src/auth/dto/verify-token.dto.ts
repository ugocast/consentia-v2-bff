import { ApiProperty } from '@nestjs/swagger';

/**
 * Respuesta de verificación de token
 */
export class VerifyTokenResponseDto {
  @ApiProperty({
    description: 'ID del usuario autenticado',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario autenticado',
    example: 'usuario@ejemplo.com'
  })
  email: string;

  @ApiProperty({
    description: 'Metadatos del usuario',
    example: {
      name: 'Juan Pérez'
    }
  })
  user_metadata: {
    name: string;
    [key: string]: any;
  };

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2023-01-01T00:00:00.000Z'
  })
  created_at: string;
}

/**
 * Respuesta de error de autenticación
 */
export class AuthErrorResponseDto {
  @ApiProperty({
    description: 'Código de error',
    example: 'INVALID_TOKEN'
  })
  code: string;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Token inválido o expirado'
  })
  message: string;

  @ApiProperty({
    description: 'Metadatos adicionales del error',
    example: {
      reason: 'invalid_signature'
    }
  })
  metadata?: Record<string, any>;
} 