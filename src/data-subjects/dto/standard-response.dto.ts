import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para respuestas de eliminación de titulares de datos
 */
export class DeleteResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'El titular de datos ha sido eliminado correctamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID del titular eliminado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}

/**
 * DTO para respuestas de solicitudes de portal
 */
export class PortalAccessResponseDto {
  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Se ha enviado un enlace de acceso a su correo electrónico',
  })
  message: string;
}

/**
 * DTO para verificación de portal
 */
export class PortalVerificationResponseDto {
  @ApiProperty({
    description: 'ID del titular de datos verificado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  dataSubjectId: string;
}

/**
 * DTO para respuestas de solicitudes de derechos ARCO
 */
export class ArcoRequestResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Solicitud procesada correctamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la solicitud',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  requestId: string;
} 