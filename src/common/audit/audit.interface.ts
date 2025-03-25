import { AuditAction, ResourceType } from './audit.types';

/**
 * Interfaz para el evento de auditoría
 */
export interface AuditEvent {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  details?: Record<string, any>;
} 