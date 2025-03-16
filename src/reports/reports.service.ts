import { Injectable, Logger } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { ConsentStatus } from '../consents/dto';
import {
  ConsentReportQueryDto,
  ConsentReportResultDto,
  AuditReportQueryDto,
  AuditReportResultDto,
  MetricsQueryDto,
  MetricsResultDto,
  MetricSeriesDto,
  AuditLogDto,
  MetricsGroupBy,
} from './dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  /**
   * Genera un reporte de consentimientos
   * @param queryDto - DTO con los parámetros de consulta para el reporte
   * @returns Reporte de consentimientos con paginación
   * @throws Error si hay un problema al generar el reporte
   */
  async generateConsentReport(
    queryDto: ConsentReportQueryDto,
  ): Promise<ConsentReportResultDto> {
    try {
      const {
        companyId,
        legalPolicyId,
        status,
        startDate,
        endDate,
        page = 1,
        pageSize = 10,
      } = queryDto;

      // Calcular el offset para la paginación
      const offset = (page - 1) * pageSize;

      // Construir la consulta base
      let query = this.supabase
        .from('consent')
        .select('*, legal_policy!inner(*)', { count: 'exact' });

      // Aplicar filtros
      if (companyId) {
        query = query.eq('legal_policy.company_id', companyId);
      }

      if (legalPolicyId) {
        query = query.eq('legal_policy_id', legalPolicyId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Ejecutar la consulta con paginación
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        this.logger.error(
          `Error al generar reporte de consentimientos: ${error.message}`,
          error,
        );
        throw new Error(
          `Error al generar reporte de consentimientos: ${error.message}`,
        );
      }

      // Transformar los datos para el formato de respuesta
      const items = data.map((item) => {
        // Extraemos la política legal pero no la necesitamos en la respuesta
        const { legal_policy: _legalPolicy, ...consent } = item;
        return consent;
      });

      // Calcular el número total de páginas
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        items,
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error al generar reporte de consentimientos', error);
      throw error;
    }
  }

  /**
   * Genera un reporte de auditoría
   * @param queryDto - DTO con los parámetros de consulta para el reporte de auditoría
   * @returns Reporte de auditoría con paginación
   * @throws Error si hay un problema al generar el reporte
   */
  async generateAuditReport(
    queryDto: AuditReportQueryDto,
  ): Promise<AuditReportResultDto> {
    try {
      const {
        companyId,
        userId,
        action,
        resourceType,
        resourceId,
        startDate,
        endDate,
        page = 1,
        pageSize = 10,
      } = queryDto;

      // Calcular el offset para la paginación
      const offset = (page - 1) * pageSize;

      // Construir la consulta base
      let query = this.supabase
        .from('audit_log')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (companyId) {
        // Para filtrar por compañía, necesitamos una subconsulta o una vista
        // Esta es una implementación simplificada que asume que hay un campo company_id en los metadatos
        query = query.contains('metadata', { companyId });
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Ejecutar la consulta con paginación
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        this.logger.error(
          `Error al generar reporte de auditoría: ${error.message}`,
          error,
        );
        throw new Error(
          `Error al generar reporte de auditoría: ${error.message}`,
        );
      }

      // Calcular el número total de páginas
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        items: data as AuditLogDto[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error al generar reporte de auditoría', error);
      throw error;
    }
  }

  /**
   * Genera métricas y KPIs
   * @param queryDto - DTO con los parámetros de consulta para las métricas
   * @returns Métricas y KPIs calculados según los parámetros de consulta
   * @throws Error si hay un problema al generar las métricas
   */
  async generateMetrics(queryDto: MetricsQueryDto): Promise<MetricsResultDto> {
    try {
      const {
        companyId,
        startDate,
        endDate,
        groupBy = MetricsGroupBy.MONTH,
      } = queryDto;

      // Obtener todos los consentimientos que coinciden con los filtros
      let query = this.supabase
        .from('consent')
        .select('*, legal_policy!inner(*)');

      // Aplicar filtros
      if (companyId) {
        query = query.eq('legal_policy.company_id', companyId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: consents, error } = await query;

      if (error) {
        this.logger.error(
          `Error al obtener consentimientos para métricas: ${error.message}`,
          error,
        );
        throw new Error(
          `Error al obtener consentimientos para métricas: ${error.message}`,
        );
      }

      // Calcular métricas
      const totalConsents = consents.length;

      // Contar consentimientos por estado
      const consentsByStatus = Object.values(ConsentStatus).map((status) => {
        const count = consents.filter(
          (consent) => consent.status === status,
        ).length;
        return {
          status,
          count,
          percentage:
            totalConsents > 0 ? Math.round((count / totalConsents) * 100) : 0,
        };
      });

      // Calcular tasas
      const grantedCount =
        consentsByStatus.find((item) => item.status === ConsentStatus.GRANTED)
          ?.count || 0;
      const revokedCount =
        consentsByStatus.find((item) => item.status === ConsentStatus.REVOKED)
          ?.count || 0;

      const acceptanceRate =
        totalConsents > 0
          ? Math.round((grantedCount / totalConsents) * 100)
          : 0;
      const revocationRate =
        grantedCount > 0 ? Math.round((revokedCount / grantedCount) * 100) : 0;

      // Generar series de datos según el tipo de agrupación
      const series: MetricSeriesDto[] = [];

      if (groupBy === MetricsGroupBy.STATUS) {
        // Agrupar por estado
        series.push({
          name: 'Consentimientos por estado',
          data: consentsByStatus.map((item) => ({
            label: item.status,
            value: item.count,
          })),
        });
      } else if (groupBy === MetricsGroupBy.POLICY) {
        // Agrupar por política
        const policyMap = new Map<string, number>();

        consents.forEach((consent) => {
          const policyId = consent.legal_policy_id;
          const policyTitle = consent.legal_policy?.title || policyId;

          if (policyMap.has(policyTitle)) {
            policyMap.set(policyTitle, policyMap.get(policyTitle)! + 1);
          } else {
            policyMap.set(policyTitle, 1);
          }
        });

        series.push({
          name: 'Consentimientos por política',
          data: Array.from(policyMap.entries()).map(([label, value]) => ({
            label,
            value,
          })),
        });
      } else {
        // Agrupar por tiempo (día, semana, mes, año)
        const timeFormat = this.getTimeFormat(groupBy);
        const timeMap = new Map<
          string,
          { total: number; granted: number; denied: number; revoked: number }
        >();

        consents.forEach((consent) => {
          const date = new Date(consent.created_at);
          const timeKey = this.formatDate(date, timeFormat);

          if (!timeMap.has(timeKey)) {
            timeMap.set(timeKey, {
              total: 0,
              granted: 0,
              denied: 0,
              revoked: 0,
            });
          }

          const stats = timeMap.get(timeKey)!;
          stats.total += 1;

          if (consent.status === ConsentStatus.GRANTED) {
            stats.granted += 1;
          } else if (consent.status === ConsentStatus.DENIED) {
            stats.denied += 1;
          } else if (consent.status === ConsentStatus.REVOKED) {
            stats.revoked += 1;
          }
        });

        // Ordenar las claves de tiempo
        const sortedTimeKeys = Array.from(timeMap.keys()).sort();

        // Crear series para total, otorgados, denegados y revocados
        series.push({
          name: 'Total de consentimientos',
          data: sortedTimeKeys.map((key) => ({
            label: key,
            value: timeMap.get(key)!.total,
          })),
        });

        series.push({
          name: 'Consentimientos otorgados',
          data: sortedTimeKeys.map((key) => ({
            label: key,
            value: timeMap.get(key)!.granted,
          })),
        });

        series.push({
          name: 'Consentimientos denegados',
          data: sortedTimeKeys.map((key) => ({
            label: key,
            value: timeMap.get(key)!.denied,
          })),
        });

        series.push({
          name: 'Consentimientos revocados',
          data: sortedTimeKeys.map((key) => ({
            label: key,
            value: timeMap.get(key)!.revoked,
          })),
        });
      }

      return {
        series,
        summary: {
          totalConsents,
          consentsByStatus,
          acceptanceRate,
          revocationRate,
        },
      };
    } catch (error) {
      this.logger.error('Error al generar métricas', error);
      throw error;
    }
  }

  /**
   * Obtiene el formato de tiempo según el tipo de agrupación
   * @param groupBy - Tipo de agrupación temporal (día, semana, mes, año)
   * @returns Formato de tiempo para la agrupación especificada
   * @private
   */
  private getTimeFormat(groupBy: MetricsGroupBy): string {
    switch (groupBy) {
      case MetricsGroupBy.DAY:
        return 'YYYY-MM-DD';
      case MetricsGroupBy.WEEK:
        return 'YYYY-[W]WW';
      case MetricsGroupBy.MONTH:
        return 'YYYY-MM';
      case MetricsGroupBy.YEAR:
        return 'YYYY';
      default:
        return 'YYYY-MM';
    }
  }

  /**
   * Formatea una fecha según el formato especificado
   * @param date - Fecha a formatear
   * @param format - Formato de tiempo a aplicar (YYYY-MM-DD, YYYY-[W]WW, YYYY-MM, YYYY)
   * @returns Fecha formateada según el formato especificado
   * @private
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Calcular el número de semana
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7,
    );
    const weekNumberStr = String(weekNumber).padStart(2, '0');

    // Reemplazar los tokens en el formato
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('[W]WW', `W${weekNumberStr}`);
  }
}
