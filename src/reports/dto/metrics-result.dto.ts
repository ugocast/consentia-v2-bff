import { ConsentStatus } from '../../consents/dto';

/**
 * DTO para un punto de datos de métricas
 */
export class MetricDataPointDto {
  /**
   * Etiqueta del punto de datos (fecha, política, estado, etc.)
   * @example "2023-01"
   */
  label: string;

  /**
   * Valor del punto de datos
   * @example 42
   */
  value: number;
}

/**
 * DTO para una serie de métricas
 */
export class MetricSeriesDto {
  /**
   * Nombre de la serie
   * @example "Consentimientos otorgados"
   */
  name: string;

  /**
   * Puntos de datos de la serie
   */
  data: MetricDataPointDto[];
}

/**
 * DTO para los resultados de métricas
 */
export class MetricsResultDto {
  /**
   * Series de datos para las métricas
   */
  series: MetricSeriesDto[];

  /**
   * Resumen de métricas
   */
  summary: {
    /**
     * Total de consentimientos
     * @example 100
     */
    totalConsents: number;

    /**
     * Consentimientos por estado
     */
    consentsByStatus: {
      /**
       * Estado del consentimiento
       * @example "GRANTED"
       */
      status: ConsentStatus;

      /**
       * Cantidad de consentimientos en este estado
       * @example 75
       */
      count: number;

      /**
       * Porcentaje de consentimientos en este estado
       * @example 75
       */
      percentage: number;
    }[];

    /**
     * Tasa de aceptación (porcentaje de consentimientos otorgados)
     * @example 75
     */
    acceptanceRate: number;

    /**
     * Tasa de revocación (porcentaje de consentimientos revocados)
     * @example 10
     */
    revocationRate: number;
  };
}
