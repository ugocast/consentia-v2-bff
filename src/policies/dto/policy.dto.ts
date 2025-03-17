import { PolicyStatus } from './policy-status.enum';

/**
 * DTO para la respuesta de políticas legales
 */
export class PolicyDto {
  /**
   * ID único de la política
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * Título de la política
   * @example "Política de Privacidad"
   */
  title: string;

  /**
   * Contenido de la política
   * @example "Esta política de privacidad describe cómo recopilamos y utilizamos sus datos personales..."
   */
  content: string;

  /**
   * ID de la compañía a la que pertenece la política
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  companyId: string;

  /**
   * ID de la versión anterior de la política
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  previousVersionId?: string;

  /**
   * Fecha desde la que es válida la política
   * @example "2023-01-01T00:00:00.000Z"
   */
  validFrom: string;

  /**
   * Fecha hasta la que es válida la política
   * @example "2023-12-31T23:59:59.999Z"
   */
  validTo?: string | null;

  /**
   * Tipos de datos incluidos en la política
   * @example ["email", "nombre", "dirección"]
   */
  dataTypes?: string[];

  /**
   * Fecha de creación de la política
   * @example "2023-01-01T00:00:00.000Z"
   */
  createdAt: string;

  /**
   * Fecha de última actualización de la política
   * @example "2023-01-01T00:00:00.000Z"
   */
  updatedAt: string;

  /**
   * Versión de la política
   * @example 1
   */
  version?: number;

  /**
   * Estado de la política
   * @example "active"
   */
  status?: PolicyStatus;

  /**
   * ID del usuario que creó la política
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  createdBy?: string;
}
