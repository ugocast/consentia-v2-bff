/**
 * Enum que representa los posibles estados de una empresa en el sistema.
 */
export enum CompanyStatus {
  /**
   * Empresa en período de prueba.
   */
  TRIAL = 'TRIAL',
  
  /**
   * Empresa activa con suscripción vigente.
   */
  ACTIVE = 'ACTIVE',
  
  /**
   * Empresa temporalmente suspendida (por falta de pago u otro motivo).
   */
  SUSPENDED = 'SUSPENDED',
  
  /**
   * Empresa que ha cancelado su suscripción.
   */
  CANCELLED = 'CANCELLED',
  
  /**
   * Empresa inactiva por decisión administrativa.
   */
  INACTIVE = 'INACTIVE',
} 