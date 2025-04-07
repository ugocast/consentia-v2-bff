import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para respuesta de registro
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'Información del usuario registrado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'usuario@ejemplo.com',
      name: 'Usuario Ejemplo',
      created_at: '2023-01-01T00:00:00.000Z',
    }
  })
  user: {
    id: string;
    email: string;
    user_metadata: {
      name: string;
      companyId?: string;
    };
    created_at: string;
  };

  @ApiProperty({
    description: 'Información de la sesión creada',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eFYu_mVN9rlYhWnqTJHQog',
      expires_at: 1716239022
    }
  })
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * DTO para respuesta de login
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Información del usuario autenticado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'usuario@ejemplo.com',
      name: 'Usuario Ejemplo',
      created_at: '2023-01-01T00:00:00.000Z',
    }
  })
  user: {
    id: string;
    email: string;
    user_metadata: {
      name: string;
      companyId?: string;
    };
    created_at: string;
  };

  @ApiProperty({
    description: 'Información de la sesión creada',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eFYu_mVN9rlYhWnqTJHQog',
      expires_at: 1716239022
    }
  })
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * DTO para respuesta de logout
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Indicador de éxito de la operación',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Sesión cerrada correctamente'
  })
  message?: string;
}

/**
 * DTO para respuesta de restablecimiento de contraseña
 */
export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Indicador de éxito de la operación',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Se ha enviado un correo para restablecer la contraseña'
  })
  message: string;
}

/**
 * DTO para respuesta de actualización de contraseña
 */
export class UpdatePasswordResponseDto {
  @ApiProperty({
    description: 'Indicador de éxito de la operación',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Contraseña actualizada correctamente'
  })
  message: string;
}

/**
 * DTO para respuesta de refrescar token
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Información del usuario autenticado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'usuario@ejemplo.com',
      name: 'Usuario Ejemplo',
      created_at: '2023-01-01T00:00:00.000Z',
    }
  })
  user: {
    id: string;
    email: string;
    user_metadata: {
      name: string;
      companyId?: string;
    };
    created_at: string;
  };

  @ApiProperty({
    description: 'Información de la sesión renovada',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'eFYu_mVN9rlYhWnqTJHQog',
      expires_at: 1716239022
    }
  })
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * DTO para respuesta de verificación de token
 */
export class VerifyTokenResponseDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com'
  })
  email: string;

  @ApiProperty({
    description: 'Metadata del usuario',
    example: {
      name: 'Usuario Ejemplo',
      companyId: '123e4567-e89b-12d3-a456-426614174001'
    }
  })
  user_metadata: {
    name: string;
    companyId?: string;
  };

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2023-01-01T00:00:00.000Z'
  })
  created_at: string;
}

/**
 * DTO para respuestas de error estandarizadas
 */
export class AuthErrorResponseDto {
  @ApiProperty({
    description: 'Código de error',
    example: 'UNAUTHORIZED'
  })
  code: string;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Credenciales inválidas'
  })
  message: string;

  @ApiProperty({
    description: 'Detalles adicionales del error',
    example: {
      reason: 'password_incorrect'
    },
    required: false
  })
  details?: Record<string, any>;
} 