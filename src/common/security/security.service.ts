import { Injectable, Logger } from '@nestjs/common';
import { createSupabaseClient } from '../../config/supabase.config';
import { AuditService, AuditAction, ResourceType } from '../audit/audit.service';
import { AuditEvent } from '../audit/audit.interface';

interface AuthEvent {
  type: 'login' | 'signup' | 'password_recovery' | 'logout';
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });
  
  constructor(private readonly auditService: AuditService) {}
  
  /**
   * Registra un evento de autenticación en el sistema de auditoría
   * @param event Información del evento de autenticación 
   */
  async recordAuthEvent(event: AuthEvent): Promise<void> {
    try {
      // Mapear el tipo de evento al tipo de acción de auditoría
      let auditAction: string;
      switch (event.type) {
        case 'login':
          auditAction = AuditAction.READ;
          break;
        case 'signup':
          auditAction = AuditAction.CREATE_USER;
          break;
        case 'password_recovery':
          auditAction = AuditAction.RESET_PASSWORD;
          break;
        case 'logout':
          auditAction = AuditAction.UPDATE_USER;
          break;
        default:
          auditAction = AuditAction.READ;
      }
      
      // Registrar el evento en el sistema de auditoría
      await this.auditService.logEvent({
        action: auditAction,
        resourceType: ResourceType.USER,
        resourceId: event.userId || 'unknown',
        userId: event.userId || 'system',
        metadata: {
          email: event.email,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          success: event.status === 'success',
          error: event.errorMessage,
          ...event.metadata,
        },
      });
      
      // Registrar en logs para eventos importantes
      if (event.status === 'failed') {
        this.logger.warn(`Intento fallido de ${event.type} para ${event.email}: ${event.errorMessage}`, {
          email: event.email,
          ipAddress: event.ipAddress,
          type: event.type,
        });
      }
    } catch (error) {
      this.logger.error(`Error al registrar evento de autenticación: ${error.message}`, error);
    }
  }
  
  /**
   * Verifica si una IP está intentando acceder a demasiadas cuentas diferentes
   * Utiliza la API administrativa de Supabase para consultar los intentos de autenticación
   * @param ipAddress Dirección IP a verificar
   * @returns true si la IP está realizando demasiados intentos, false en caso contrario
   */
  async isSuspiciousIP(ipAddress: string): Promise<boolean> {
    try {
      // En una implementación real, usaríamos la API admin de Supabase para verificar
      // Los intentos de autenticación por IP, pero necesitaríamos derechos administrativos
      
      // Como alternativa, podemos usar nuestra propia auditoría
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const { data, error } = await this.supabase
        .from('audit_log')
        .select('resource_id, metadata')
        .eq('action', 'LOGIN')
        .gt('created_at', oneHourAgo.toISOString())
        .filter('metadata->ipAddress', 'eq', ipAddress);
      
      if (error) {
        this.logger.error(`Error al verificar IP sospechosa: ${error.message}`, error);
        return false;
      }
      
      // Contar usuarios únicos que esta IP ha intentado acceder
      const uniqueUserIds = new Set();
      for (const log of data || []) {
        if (log.resource_id && log.resource_id !== 'unknown') {
          uniqueUserIds.add(log.resource_id);
        }
      }
      
      // Si una IP intenta acceder a más de 10 cuentas diferentes en una hora, es sospechosa
      const threshold = 10;
      return uniqueUserIds.size > threshold;
    } catch (error) {
      this.logger.error(`Error al verificar IP sospechosa: ${error.message}`, error);
      return false;
    }
  }
  
  /**
   * Verifica y notifica actividades sospechosas
   * @param userId ID del usuario
   * @param ipAddress Dirección IP
   * @param userAgent User Agent del navegador
   */
  async detectSuspiciousActivity(userId: string, ipAddress: string, userAgent?: string): Promise<boolean> {
    try {
      // Buscar accesos anteriores para este usuario
      const { data, error } = await this.supabase
        .from('audit_log')
        .select('metadata')
        .eq('resource_id', userId)
        .eq('action', 'LOGIN')
        .eq('metadata->>success', 'true')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        this.logger.error(`Error al detectar actividad sospechosa: ${error.message}`, error);
        return false;
      }
      
      // Si es el primer login, no hay nada que comparar
      if (!data || data.length === 0) {
        return false;
      }
      
      // Verificar si alguna vez se ha accedido desde esta IP
      const knownIPs = new Set();
      for (const log of data) {
        if (log.metadata && log.metadata.ipAddress) {
          knownIPs.add(log.metadata.ipAddress);
        }
      }
      
      // Si es una IP desconocida y hay logins anteriores, podría ser sospechoso
      return !knownIPs.has(ipAddress) && knownIPs.size > 0;
    } catch (error) {
      this.logger.error(`Error al detectar actividad sospechosa: ${error.message}`, error);
      return false;
    }
  }
} 