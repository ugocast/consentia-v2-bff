/**
 * Enum para el estado de una solicitud de acceso a datos
 */
export enum DataRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

/**
 * Tipo para representar un valor de datos personales
 */
export type PersonalDataValue = string | number | boolean | null | Record<string, any>;

/**
 * DTO para la respuesta a solicitudes de acceso a datos personales
 */
export class DataAccessResponseDto {
  /**
   * ID único de la solicitud de acceso
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  requestId: string;

  /**
   * ID del titular de datos
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  dataSubjectId: string;

  /**
   * Fecha de la solicitud
   * @example "2024-03-20T12:00:00Z"
   */
  requestDate: string;

  /**
   * Fecha de procesamiento de la solicitud
   * @example "2024-03-21T14:30:00Z"
   */
  processedDate: string;

  /**
   * Estado de la solicitud
   * @example "completed"
   */
  status: DataRequestStatus;

  /**
   * Datos personales solicitados, organizados por categoría de datos
   */
  personalData: {
    /**
     * Categoría del tipo de dato
     * @example "Información de contacto"
     */
    category: string;
    
    /**
     * Datos específicos de la categoría
     */
    data: {
      /**
       * Tipo de dato
       * @example "Email"
       */
      dataType: string;
      
      /**
       * Código del tipo de dato
       * @example "EMAIL"
       */
      dataTypeCode: string;
      
      /**
       * Valor almacenado
       * @example "usuario@ejemplo.com"
       */
      value: PersonalDataValue;
      
      /**
       * Fecha de última actualización
       * @example "2024-02-15T10:30:00Z"
       */
      lastUpdated: string;
    }[];
  }[];

  /**
   * Enlace de descarga de los datos en formato estructurado (si aplica)
   * @example "https://api.consentia.com/download/123e4567-e89b-12d3-a456-426614174000"
   */
  downloadLink?: string;

  /**
   * Fecha de expiración del enlace de descarga (si aplica)
   * @example "2024-04-20T12:00:00Z"
   */
  downloadLinkExpiry?: string;
} 