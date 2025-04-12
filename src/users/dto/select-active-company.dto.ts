import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO para seleccionar la compañía activa del usuario
 */
export class SelectActiveCompanyDto {
  /**
   * ID de la compañía a establecer como activa
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'ID de la compañía a establecer como activa',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID('4', { message: 'El ID de compañía debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de compañía es requerido' })
  companyId: string;
}

/**
 * DTO para la respuesta de selección de compañía activa
 */
export class ActiveCompanyResponseDto {
  /**
   * Indica si la operación fue exitosa
   * @example true
   */
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true
  })
  success: boolean;

  /**
   * Mensaje descriptivo del resultado
   * @example "Compañía activa establecida correctamente"
   */
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Compañía activa establecida correctamente'
  })
  message: string;

  /**
   * ID de la compañía establecida como activa
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'ID de la compañía establecida como activa',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  companyId: string;

  /**
   * Nombre de la compañía establecida como activa
   * @example "Acme Inc."
   */
  @ApiProperty({
    description: 'Nombre de la compañía establecida como activa',
    example: 'Acme Inc.'
  })
  companyName: string;
} 