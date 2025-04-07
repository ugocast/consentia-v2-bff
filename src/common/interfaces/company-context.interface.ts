import { Request } from 'express';

/**
 * Interfaz para el contexto de empresa que se adjunta a la solicitud
 */
export interface CompanyContext {
  /** ID de la empresa activa */
  companyId: string;
  /** Rol del usuario en la empresa */
  userRole: string;
  /** ID del usuario autenticado */
  userId: string;
}

/**
 * Interfaz para el usuario autenticado en la solicitud
 */
export interface AuthUser {
  /** ID del usuario */
  id: string;
  /** Email del usuario */
  email: string;
  /** Roles globales del usuario */
  roles?: string[];
  [key: string]: any;
}

/**
 * Extensión de la interfaz Request de Express para incluir el contexto de empresa
 */
export interface RequestWithCompanyContext extends Request {
  /** Contexto de empresa, si está disponible */
  companyContext?: CompanyContext;
  /** Usuario autenticado, si está disponible */
  user?: AuthUser;
} 