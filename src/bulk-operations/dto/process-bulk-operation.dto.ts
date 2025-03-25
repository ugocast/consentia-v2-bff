import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessBulkOperationDto {
  @ApiProperty({
    description: 'Comentarios opcionales sobre el procesamiento',
    required: false,
    example: 'Procesando consentimientos en lote'
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({
    description: 'Metadatos adicionales para el procesamiento',
    required: false,
    example: { priority: 'high', notification: true }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 