import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../security.service';

@Injectable()
export class AuthAuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthAuditMiddleware.name);
  private readonly AUTH_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
    '/auth/update-password',
    '/auth/logout',
    '/auth/refresh-token'
  ];

  constructor(private readonly securityService: SecurityService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Solo interceptar rutas de autenticación
    if (!this.AUTH_ROUTES.includes(req.path)) {
      return next();
    }

    // Capturar la respuesta original
    const originalSend = res.send;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Determinar el tipo de operación de autenticación
    let type: 'login' | 'signup' | 'password_recovery' | 'logout';
    switch (req.path) {
      case '/auth/login': 
        type = 'login'; 
        break;
      case '/auth/register': 
        type = 'signup'; 
        break;
      case '/auth/reset-password': 
      case '/auth/update-password': 
        type = 'password_recovery'; 
        break;
      case '/auth/logout': 
        type = 'logout'; 
        break;
      default: 
        type = 'login';
    }

    // Obtener email desde el cuerpo de la petición
    const email = req.body?.email || 'unknown';

    // Interceptar la respuesta para detectar éxito o fracaso
    res.send = function (body) {
      try {
        // Restaurar el método send original
        res.send = originalSend;
        
        // Parsear el cuerpo de la respuesta
        const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        
        // Obtener el ID de usuario si está disponible en la respuesta
        const userId = responseBody?.user?.id || (req as any).user?.id || undefined;
        
        // Detectar actividad sospechosa para logins exitosos
        if (isSuccess && type === 'login' && userId) {
          this.securityService.detectSuspiciousActivity(userId, ipAddress, userAgent)
            .then(isSuspicious => {
              if (isSuspicious) {
                this.logger.warn(`Actividad sospechosa detectada para el usuario ${userId}: Login desde IP desconocida ${ipAddress}`);
                // Aquí se podría implementar alguna notificación
              }
            })
            .catch(error => {
              this.logger.error(`Error al detectar actividad sospechosa: ${error.message}`, error);
            });
        }
        
        // Registrar el evento de autenticación
        this.securityService.recordAuthEvent({
          type,
          userId,
          email,
          ipAddress,
          userAgent,
          status: isSuccess ? 'success' : 'failed',
          errorMessage: !isSuccess ? responseBody?.message || 'Error desconocido' : undefined,
          details: {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode
          }
        }).catch(error => {
          this.logger.error(`Error al registrar evento de autenticación: ${error.message}`, error);
        });
        
        // Continuar con la respuesta original
        return originalSend.call(res, body);
      } catch (error) {
        this.logger.error(`Error en middleware de auditoría: ${error.message}`, error);
        // Continuar con la respuesta original en caso de error
        return originalSend.call(res, body);
      }
    };
    
    // Continuar con el flujo de la solicitud
    next();
  }
} 