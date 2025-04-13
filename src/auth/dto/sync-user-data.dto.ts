import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OnboardingStatus {
  REGISTERED = 'REGISTERED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  COMPANY_ASSIGNED = 'COMPANY_ASSIGNED',
  COMPLETED = 'COMPLETED'
}

/**
 * DTO para sincronizar datos de usuario entre Supabase y BFF
 */
export class SyncUserDataDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez Rodríguez',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Número de teléfono del usuario',
    example: '+34600000000',
    required: false
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Estado actual del onboarding del usuario',
    example: 'COMPLETED',
    required: false
  })
  @IsString()
  @IsOptional()
  onboardingStatus?: string;

  @ApiProperty({
    description: 'Datos adicionales del usuario en formato libre',
    example: { preference: 'dark-mode', language: 'es' },
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Respuesta de sincronización de datos de usuario
 */
export class SyncUserDataResponseDto {
  @ApiProperty({
    description: 'Indica si la sincronización fue exitosa',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Datos de usuario sincronizados correctamente'
  })
  message: string;

  @ApiProperty({
    description: 'Datos del usuario sincronizados',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'juan.perez@ejemplo.com',
      name: 'Juan Pérez Rodríguez',
      onboardingStatus: 'COMPLETED'
    }
  })
  userData: {
    id: string;
    email: string;
    name?: string;
    onboardingStatus?: string;
    [key: string]: any;
  };
} 