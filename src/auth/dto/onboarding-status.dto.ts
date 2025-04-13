import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta del estado de onboarding
 */
export class OnboardingStatusResponseDto {
  @ApiProperty({
    description: 'Indica si el usuario tiene un email verificado',
    example: true
  })
  hasVerifiedEmail: boolean;

  @ApiProperty({
    description: 'Indica si el usuario pertenece a alguna compañía',
    example: true
  })
  hasCompany: boolean;

  @ApiProperty({
    description: 'Lista de compañías a las que pertenece el usuario',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Empresa Ejemplo S.L.',
        role: 'ADMIN'
      }
    ]
  })
  companies: Array<{
    id: string;
    name: string;
    role: string;
    [key: string]: any;
  }>;
} 