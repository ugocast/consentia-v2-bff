import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../enums/permission.enum';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionsMetadata = this.reflector.getAllAndOverride(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Si no hay permisos requeridos, permitir acceso
    if (!permissionsMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyContext = request.companyContext;
    
    // Verificar que exista el contexto de compañía (debe ser agregado por CompanyRolesGuard)
    if (!companyContext) {
      this.logger.warn('Intento de acceso sin contexto de compañía a ruta protegida por permisos');
      throw new ForbiddenException('Acceso denegado: Contexto de compañía no encontrado');
    }
    
    const { userRole } = companyContext;
    
    try {
      let hasRequiredPermissions: boolean;
      
      if (Array.isArray(permissionsMetadata)) {
        // Lista simple de permisos (al menos uno)
        hasRequiredPermissions = this.permissionsService.hasAnyPermission(
          userRole,
          permissionsMetadata as Permission[]
        );
      } else if (permissionsMetadata.all) {
        // Requiere todos los permisos
        hasRequiredPermissions = this.permissionsService.hasAllPermissions(
          userRole,
          permissionsMetadata.all as Permission[]
        );
      } else if (permissionsMetadata.any) {
        // Requiere al menos uno de los permisos
        hasRequiredPermissions = this.permissionsService.hasAnyPermission(
          userRole,
          permissionsMetadata.any as Permission[]
        );
      } else {
        // Formato no reconocido
        this.logger.error('Formato de permisos no reconocido', permissionsMetadata);
        hasRequiredPermissions = false;
      }
      
      if (!hasRequiredPermissions) {
        this.logger.warn(
          `Acceso denegado: Usuario con rol ${userRole} no tiene los permisos requeridos`
        );
        throw new ForbiddenException('Acceso denegado: Permisos insuficientes para esta operación');
      }
      
      return true;
    } catch (error) {
      // Si la excepción ya es un ForbiddenException, reenviarla
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error al validar permisos: ${error.message}`, error.stack);
      throw new ForbiddenException('Error al validar permisos de acceso');
    }
  }
} 