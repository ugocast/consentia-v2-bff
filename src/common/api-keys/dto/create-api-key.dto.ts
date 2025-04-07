import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';

/**
 * DTO para la creación de una clave API
 */
export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la clave API',
    example: 'Integración con CRM',
  })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name: string;

  @ApiProperty({
    description: 'ID de la empresa a la que pertenece la clave',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'El ID de la empresa es requerido' })
  @IsUUID('4', { message: 'El ID de la empresa debe ser un UUID válido' })
  companyId: string;

  @ApiProperty({
    description: 'Fecha de expiración (opcional)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de expiración debe tener un formato de fecha válido' })
  expiresAt?: string;
} 