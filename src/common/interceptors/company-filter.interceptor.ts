import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { SKIP_COMPANY_CONTEXT_KEY } from '../decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../interfaces/company-context.interface';

// Marca para endpoints que deben ignorar el filtro automático por compañía
export const SKIP_COMPANY_FILTER_KEY = 'skip_company_filter';

/**
 * Decorador para marcar un controlador o endpoint que debe ignorar el filtro automático por compañía
 */
export const SkipCompanyFilter = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(SKIP_COMPANY_FILTER_KEY, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(SKIP_COMPANY_FILTER_KEY, true, target);
    return target;
  };
};

@Injectable()
export class CompanyFilterInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CompanyFilterInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Verificar si se debe omitir el filtro
    const skipFilter = this.reflector.getAllAndOverride<boolean>(
      SKIP_COMPANY_FILTER_KEY,
      [context.getHandler(), context.getClass()]
    );

    const skipContext = this.reflector.getAllAndOverride<boolean>(
      SKIP_COMPANY_CONTEXT_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Si está marcado para omitir o no requiere contexto, no aplicar filtro
    if (skipFilter || skipContext) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithCompanyContext>();
    const { companyContext } = request;

    // Si no hay contexto de empresa, ignorar (el guard CompanyContext ya habrá manejado este caso)
    if (!companyContext || !companyContext.companyId) {
      return next.handle();
    }

    // Modificar los parámetros para incluir el filtro de compañía
    this.addCompanyFilter(request, companyContext.companyId);

    return next.handle();
  }

  private addCompanyFilter(request: RequestWithCompanyContext, companyId: string): void {
    try {
      // Verificar si hay parámetros de consulta y crearlos si no existen
      if (!request.query) {
        request.query = {};
      }

      // Añadir el ID de compañía a los parámetros si no existe ya
      if (!request.query.companyId) {
        request.query.companyId = companyId;
        this.logger.debug(`Añadido filtro automático por companyId=${companyId} a ${request.method} ${request.path}`);
      }

      // Añadir el ID de compañía al cuerpo de la solicitud si existe
      if (request.body && typeof request.body === 'object' && !request.body.companyId) {
        (request.body as any).companyId = companyId;
      }
    } catch (error) {
      this.logger.error(`Error al aplicar filtro de compañía: ${error.message}`);
      // No interrumpimos la solicitud, solo registramos el error
    }
  }
} 