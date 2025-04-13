import { ApiProperty } from '@nestjs/swagger';
import { PolicyStatus } from './policy-status.enum';

/**
 * DTO para respuestas generales de políticas legales
 */
export class PolicyResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Operación completada exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la política',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}

/**
 * DTO para respuestas de creación de políticas
 */
export class PolicyCreateResponseDto {
  @ApiProperty({
    description: 'Mensaje de éxito',
    example: 'Política legal creada exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la política creada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Versión de la política',
    example: 1,
  })
  version: number;

  @ApiProperty({
    description: 'Fecha desde la que es válida la política',
    example: '2023-01-01T00:00:00.000Z',
  })
  validFrom: string;
}

/**
 * DTO para respuestas de actualización de versiones de políticas
 */
export class PolicyVersionResponseDto {
  @ApiProperty({
    description: 'Mensaje de éxito',
    example: 'Nueva versión de política creada exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la nueva versión de política',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID de la versión anterior de la política',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  previousVersionId: string;

  @ApiProperty({
    description: 'Número de versión',
    example: 2,
  })
  version: number;
}

/**
 * DTO para respuestas de actualización de estado de políticas
 */
export class PolicyStatusResponseDto {
  @ApiProperty({
    description: 'Mensaje de éxito',
    example: 'Estado de política actualizado correctamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la política',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Estado anterior de la política',
    enum: PolicyStatus,
    example: PolicyStatus.DRAFT,
  })
  previousStatus: PolicyStatus;

  @ApiProperty({
    description: 'Estado actual de la política',
    enum: PolicyStatus,
    example: PolicyStatus.ACTIVE,
  })
  currentStatus: PolicyStatus;
}

/**
 * DTO para respuestas de eliminación de políticas
 */
export class PolicyDeleteResponseDto {
  @ApiProperty({
    description: 'Mensaje de éxito',
    example: 'Política eliminada correctamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la política eliminada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}

/**
 * DTO para respuesta estándar de establecer política activa para empresa
 */
export class PolicySetActiveResponseDto {
  @ApiProperty({
    description: 'Mensaje de éxito',
    example: 'Política establecida como activa exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la política establecida como activa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  policyId: string;

  @ApiProperty({
    description: 'ID de la empresa',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  companyId: string;

  @ApiProperty({
    description: 'ID de la política activa anterior (si existía)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  previousActivePolicyId: string | null;
} 