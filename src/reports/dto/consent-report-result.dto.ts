import { ApiProperty } from '@nestjs/swagger';
import { ConsentStatus } from '../../consents/dto';

/**
 * DTO para los resultados de reportes de consentimientos
 */
export class ConsentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del consentimiento',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'ID de la política legal asociada',
  })
  legal_policy_id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'ID del usuario que otorgó el consentimiento',
  })
  user_id: string;

  @ApiProperty({
    example: ConsentStatus.GRANTED,
    description: 'Estado actual del consentimiento',
    enum: ConsentStatus,
  })
  status: ConsentStatus;

  @ApiProperty({
    example: '192.168.1.1',
    description: 'Dirección IP desde donde se otorgó el consentimiento',
  })
  ip_address: string;

  @ApiProperty({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    description: 'User agent del navegador utilizado',
  })
  user_agent: string;

  @ApiProperty({
    example: '2023-01-15T14:30:00Z',
    description: 'Fecha y hora de creación',
  })
  created_at: string;

  @ApiProperty({
    example: '2023-01-15T14:30:00Z',
    description: 'Fecha y hora de la última actualización',
  })
  updated_at: string;
}

export class ConsentReportResultDto {
  @ApiProperty({
    type: [ConsentDto],
    description: 'Lista de consentimientos que coinciden con los criterios de búsqueda',
  })
  items: ConsentDto[];

  @ApiProperty({
    example: 100,
    description: 'Número total de consentimientos que coinciden con los criterios',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Número de página actual',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Número de elementos por página',
  })
  pageSize: number;

  @ApiProperty({
    example: 10,
    description: 'Número total de páginas',
  })
  totalPages: number;
} 