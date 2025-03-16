import { ConsentDto } from './consent.dto';
import { PolicyDto } from '../../policies/dto';

/**
 * DTO para la respuesta detallada de consentimientos
 */
export class ConsentWithDetailsDto extends ConsentDto {
  /**
   * Detalles de la política legal asociada al consentimiento
   */
  legal_policy?: PolicyDto;

  /**
   * Detalles del titular de los datos
   */
  data_subject?: {
    id: string;
    email: string;
    name: string;
  };

  /**
   * Tipos de datos incluidos en el consentimiento
   */
  data_types?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}
