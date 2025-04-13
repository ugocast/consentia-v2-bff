import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para respuestas de eliminación de titulares de datos
 */
export class DeleteResponseDto {
  /**
   * Mensaje de confirmación
   * @example "El titular de datos ha sido eliminado correctamente"
   */
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'El titular de datos ha sido eliminado correctamente',
  })
  message: string;

  /**
   * ID del titular de datos eliminado
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'ID del titular de datos eliminado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}

/**
 * DTO para respuestas de solicitudes de portal
 */
export class PortalAccessResponseDto {
  /**
   * Indica si la operación fue exitosa
   * @example true
   */
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;
  
  /**
   * Mensaje de respuesta
   * @example "Se ha enviado un enlace de acceso a su correo electrónico"
   */
  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Se ha enviado un enlace de acceso a su correo electrónico',
  })
  message: string;
}

/**
 * DTO para respuestas de solicitudes de derechos ARCO
 */
export class ArcoRequestResponseDto {
  /**
   * Mensaje de confirmación
   * @example "Su solicitud ha sido procesada correctamente"
   */
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Su solicitud ha sido procesada correctamente',
  })
  message: string;

  /**
   * ID de la solicitud procesada
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'ID de la solicitud procesada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestId: string;
} 