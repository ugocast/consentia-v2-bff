import { CompanyUserStatus } from './company-user-status.enum';
import { CompanyUserRole } from './company-user-role.enum';

/**
 * DTO para la respuesta de usuarios de compañía
 */
export class CompanyUserDto {
  /**
   * ID único del usuario de compañía
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id: string;

  /**
   * ID de la compañía a la que pertenece el usuario
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  companyId: string;

  /**
   * ID de autenticación del usuario
   * @example "auth0|123456789"
   */
  authId: string;

  /**
   * Nombre completo del usuario
   * @example "Juan Pérez"
   */
  fullName: string;

  /**
   * Correo electrónico del usuario
   * @example "juan.perez@company.com"
   */
  email: string;

  /**
   * Rol del usuario en la compañía
   * @example "admin"
   */
  role: CompanyUserRole;

  /**
   * Estado del usuario en la compañía
   * @example "active"
   */
  status: CompanyUserStatus;

  /**
   * Metadatos adicionales del usuario
   * @example { "preferences": { "language": "es", "notifications": true } }
   */
  metadata?: Record<string, any>;

  /**
   * Fecha de creación
   * @example "2024-03-20T12:00:00Z"
   */
  createdAt: string;

  /**
   * Fecha de última actualización
   * @example "2024-03-20T12:00:00Z"
   */
  updatedAt: string;
} 