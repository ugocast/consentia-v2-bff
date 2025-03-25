import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService, AuditAction, ResourceType } from '../audit/audit.service';
import { Reflector } from '@nestjs/core';

/**
 * Metadata key para configurar auditoría en controladores o métodos
 */
export const AUDIT_KEY = 'audit';

/**
 * Interface para configuración de auditoría
 */
export interface AuditConfig {
  action: AuditAction;
  resourceType: ResourceType;
}

/**
 * Decorador para marcar endpoints que deben ser auditados
 * @param config Configuración de auditoría
 */
export const Audit = (config: AuditConfig) => {
  return (
    target: any,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor) {
      // Para métodos
      Reflect.defineMetadata(AUDIT_KEY, config, descriptor.value);
      return descriptor;
    }
    // Para clases
    Reflect.defineMetadata(AUDIT_KEY, config, target);
    return target;
  };
};

/**
 * Interceptor que registra operaciones en el log de auditoría
 * Se puede configurar a nivel de controlador o método con el decorador @Audit
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const method = request.method;
    const url = request.url;
    
    // Obtener configuración de auditoría del decorador
    const auditConfig = this.getAuditConfig(context);
    
    // Si no hay configuración y no es una operación CRUD, no auditar
    if (!auditConfig && !this.shouldAuditOperation(method)) {
      return next.handle();
    }
    
    // Determinar acción y tipo de recurso basado en el método y la URL
    const action = auditConfig?.action || this.getActionFromMethod(method);
    const resourceType = auditConfig?.resourceType || this.getResourceTypeFromUrl(url);
    const resourceId = this.getResourceIdFromUrl(url);
    
    // Si no se puede determinar el tipo de recurso, no auditar
    if (!resourceType) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Solo auditar operaciones exitosas
          this.logAuditEvent(
            action,
            resourceType,
            resourceId || 'multiple',
            userId,
            request,
            data,
          );
        },
        error: (error) => {
          // Opcionalmente auditar errores
          this.logger.debug(`Error en operación ${action} en ${resourceType}: ${error.message}`);
        },
      }),
    );
  }

  /**
   * Obtiene la configuración de auditoría del decorador @Audit
   */
  private getAuditConfig(context: ExecutionContext): AuditConfig | undefined {
    const handler = context.getHandler();
    const controller = context.getClass();
    
    // Primero intentar obtener configuración del método, luego del controlador
    return (
      this.reflector.get<AuditConfig>(AUDIT_KEY, handler) ||
      this.reflector.get<AuditConfig>(AUDIT_KEY, controller)
    );
  }

  /**
   * Determina si una operación debe ser auditada basado en el método HTTP
   */
  private shouldAuditOperation(method: string): boolean {
    // Auditar todas las operaciones de escritura
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }

  /**
   * Convierte el método HTTP en una acción de auditoría
   */
  private getActionFromMethod(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      case 'GET':
        return AuditAction.READ;
      default:
        return AuditAction.READ;
    }
  }

  /**
   * Extrae el tipo de recurso de la URL
   */
  private getResourceTypeFromUrl(url: string): ResourceType | undefined {
    const urlParts = url.split('/').filter(Boolean);
    
    if (urlParts.length === 0) return undefined;
    
    // Mapa de rutas a tipos de recursos
    const resourceMap: Record<string, ResourceType> = {
      'consents': ResourceType.CONSENT,
      'policies': ResourceType.POLICY,
      'users': ResourceType.USER,
      'companies': ResourceType.COMPANY,
      'company-users': ResourceType.COMPANY_USER,
      'data-types': ResourceType.DATA_TYPE,
      'data-subjects': ResourceType.USER,
      'bulk-operations': ResourceType.BULK_OPERATION,
      'external-integrations': ResourceType.EXTERNAL_INTEGRATION,
      'consent-data-types': ResourceType.CONSENT_DATA_TYPE,
    };
    
    // Buscar el primer segmento de URL que coincida con un tipo de recurso
    for (const part of urlParts) {
      if (resourceMap[part]) {
        return resourceMap[part];
      }
    }
    
    return undefined;
  }

  /**
   * Extrae el ID del recurso de la URL
   */
  private getResourceIdFromUrl(url: string): string | undefined {
    const urlParts = url.split('/').filter(Boolean);
    
    // Buscar un segmento que parezca un UUID
    for (let i = 0; i < urlParts.length; i++) {
      const part = urlParts[i];
      // Patrón simple para UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
        return part;
      }
    }
    
    return undefined;
  }

  /**
   * Registra un evento de auditoría
   */
  private logAuditEvent(
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    userId: string | undefined,
    request: any,
    responseData: any,
  ): void {
    try {
      const ipAddress = request.ip || request.connection?.remoteAddress;
      const userAgent = request.headers['user-agent'];
      
      // Construir metadata con datos relevantes
      const metadata: Record<string, any> = {
        url: request.url,
        method: request.method,
      };
      
      // Para operaciones POST, incluir el cuerpo de la solicitud
      if (request.method === 'POST' && request.body) {
        metadata.requestBody = this.sanitizeBody(request.body);
      }
      
      // Para operaciones que retornan datos, incluir ID de recurso creado
      if (responseData && responseData.id) {
        metadata.resultId = responseData.id;
      }
      
      // Registrar el evento
      this.auditService.log({
        action,
        resourceType,
        resourceId,
        userId: userId || 'anonymous',
        metadata,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      this.logger.error(`Error al registrar evento de auditoría: ${error.message}`, error);
    }
  }

  /**
   * Sanitiza el cuerpo de la solicitud para eliminar información sensible
   */
  private sanitizeBody(body: any): any {
    if (!body) return {};
    
    const sanitized = { ...body };
    
    // Eliminar campos sensibles
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
} 