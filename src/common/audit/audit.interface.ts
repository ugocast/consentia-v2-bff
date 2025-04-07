import { AuditAction, ResourceType } from './audit.types';

/**
 * Interfaz para eventos de auditoría
 */
export interface AuditEvent {
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>; // Para mantener compatibilidad con código existente
} 