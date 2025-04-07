import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Verificar que el usuario exista y tenga roles
    if (!user) {
      this.logger.warn('Intento de acceso sin usuario autenticado a ruta protegida por roles');
      throw new ForbiddenException('Acceso denegado: Usuario no autenticado');
    }
    
    if (!user.roles || !Array.isArray(user.roles)) {
      this.logger.warn(`Usuario ${user.id} sin roles definidos intentando acceder a ruta protegida`);
      throw new ForbiddenException('Acceso denegado: Usuario sin roles asignados');
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRole = requiredRoles.some(role => user.roles.includes(role));
    
    if (!hasRole) {
      this.logger.warn(
        `Acceso denegado: Usuario ${user.id} con roles [${user.roles.join(', ')}] ` +
        `intentó acceder a ruta que requiere [${requiredRoles.join(', ')}]`
      );
    }
    
    return hasRole;
  }
}
