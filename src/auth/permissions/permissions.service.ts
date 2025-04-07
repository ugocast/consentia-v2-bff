import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';
import { Permission } from '../enums/permission.enum';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  
  // Mapa de roles a permisos
  private readonly rolePermissionsMap: Record<UserRole, Permission[]> = {
    [UserRole.ADMIN]: [
      // Admin tiene todos los permisos
      ...Object.values(Permission),
    ],
    [UserRole.MANAGER]: [
      // Permisos de empresa
      Permission.VIEW_COMPANY,
      
      // Permisos de usuarios
      Permission.VIEW_USERS,
      Permission.CREATE_USER,
      Permission.EDIT_USER,
      Permission.INVITE_USER,
      
      // Permisos de consentimientos
      Permission.VIEW_CONSENTS,
      Permission.CREATE_CONSENT,
      Permission.EDIT_CONSENT,
      Permission.EXPORT_CONSENTS,
      
      // Permisos de políticas
      Permission.VIEW_POLICIES,
      Permission.CREATE_POLICY,
      Permission.EDIT_POLICY,
      
      // Permisos de titulares de datos
      Permission.VIEW_DATA_SUBJECTS,
      Permission.CREATE_DATA_SUBJECT,
      Permission.EDIT_DATA_SUBJECT,
      Permission.EXPORT_DATA_SUBJECTS,
      
      // Permisos de auditoría
      Permission.VIEW_AUDIT_LOGS,
      
      // Permisos de configuración
      Permission.VIEW_SETTINGS,
      
      // Permisos de reportes
      Permission.VIEW_REPORTS,
      Permission.CREATE_REPORT,
      Permission.SCHEDULE_REPORT,
      
      // Permisos de operaciones masivas
      Permission.VIEW_BULK_OPERATIONS,
      Permission.CREATE_BULK_OPERATION,
    ],
    [UserRole.AUDITOR]: [
      // Permisos de empresa
      Permission.VIEW_COMPANY,
      
      // Permisos de usuarios
      Permission.VIEW_USERS,
      
      // Permisos de consentimientos
      Permission.VIEW_CONSENTS,
      Permission.EXPORT_CONSENTS,
      
      // Permisos de políticas
      Permission.VIEW_POLICIES,
      
      // Permisos de titulares de datos
      Permission.VIEW_DATA_SUBJECTS,
      Permission.EXPORT_DATA_SUBJECTS,
      
      // Permisos de auditoría
      Permission.VIEW_AUDIT_LOGS,
      Permission.EXPORT_AUDIT_LOGS,
      
      // Permisos de configuración
      Permission.VIEW_SETTINGS,
      
      // Permisos de reportes
      Permission.VIEW_REPORTS,
      
      // Permisos de operaciones masivas
      Permission.VIEW_BULK_OPERATIONS,
    ],
    [UserRole.OPERATOR]: [
      // Permisos de consentimientos
      Permission.VIEW_CONSENTS,
      Permission.CREATE_CONSENT,
      Permission.EXPORT_CONSENTS,
      
      // Permisos de políticas
      Permission.VIEW_POLICIES,
      
      // Permisos de titulares de datos
      Permission.VIEW_DATA_SUBJECTS,
      Permission.CREATE_DATA_SUBJECT,
      Permission.EDIT_DATA_SUBJECT,
      
      // Permisos de reportes
      Permission.VIEW_REPORTS,
      
      // Permisos de operaciones masivas
      Permission.VIEW_BULK_OPERATIONS,
      Permission.CREATE_BULK_OPERATION,
    ],
    [UserRole.USER]: [
      // Permisos básicos
      Permission.VIEW_CONSENTS,
      Permission.VIEW_POLICIES,
      Permission.VIEW_DATA_SUBJECTS,
    ],
  };

  /**
   * Obtiene todos los permisos asignados a un rol
   */
  getPermissionsForRole(role: UserRole): Permission[] {
    return this.rolePermissionsMap[role] || [];
  }

  /**
   * Verifica si un rol tiene un permiso específico
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  /**
   * Verifica si un rol tiene todos los permisos especificados
   */
  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.every(permission => rolePermissions.includes(permission));
  }

  /**
   * Verifica si un rol tiene al menos uno de los permisos especificados
   */
  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.some(permission => rolePermissions.includes(permission));
  }
} 