import { ConsentDto } from './consent.dto';
import { PolicyDto } from '../../policies/dto';

/**
 * DTO para la respuesta detallada de consentimientos
 */
export class ConsentWithDetailsDto extends ConsentDto {
  /**
   * Detalles de la política legal asociada al consentimiento
   */
  legalPolicy?: PolicyDto;

  /**
   * Detalles del titular de los datos
   */
  dataSubject?: {
    id: string;
    email: string;
    name: string;
  };

  /**
   * Tipos de datos incluidos en el consentimiento
   */
  dataTypes?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}
