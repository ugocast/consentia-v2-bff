import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { CompanyUsersService } from '../../company-users/company-users.service';

@Injectable()
export class CompanyRolesGuard implements CanActivate {
  private readonly logger = new Logger(CompanyRolesGuard.name);
  
  constructor(
    private reflector: Reflector,
    private companyUsersService: CompanyUsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const companyId = request.params.companyId || request.headers['x-company-id'];
    
    // Verificar que el usuario exista
    if (!user) {
      this.logger.warn('Intento de acceso sin usuario autenticado a ruta protegida por roles');
      throw new ForbiddenException('Acceso denegado: Usuario no autenticado');
    }
    
    // Verificar que exista el ID de compañía
    if (!companyId) {
      this.logger.warn(`Usuario ${user.id} intentando acceder sin especificar compañía`);
      throw new ForbiddenException('Acceso denegado: Compañía no especificada');
    }

    try {
      // Obtener el rol del usuario en la compañía específica
      const companyUser = await this.companyUsersService.findByUserAndCompany(
        user.id,
        companyId,
        true // Incluir usuarios INACTIVE para logging
      );

      if (!companyUser) {
        this.logger.warn(`Usuario ${user.id} no pertenece a la compañía ${companyId}`);
        throw new ForbiddenException('Acceso denegado: Usuario no pertenece a esta compañía');
      }

      // Verificar si el usuario está activo en la compañía
      if (companyUser.status.toUpperCase() !== 'ACTIVE') {
        this.logger.warn(
          `Usuario ${user.id} con estado ${companyUser.status} en compañía ${companyId}`
        );
        throw new ForbiddenException(`Acceso denegado: Usuario no activo en esta compañía (${companyUser.status})`);
      }

      // Verificar si el rol del usuario en la compañía coincide con los roles requeridos
      const userRoleValue = companyUser.role.toLowerCase();
      const hasRequiredRole = requiredRoles.some(role => 
        role.toLowerCase() === userRoleValue
      );
      
      if (!hasRequiredRole) {
        this.logger.warn(
          `Acceso denegado: Usuario ${user.id} con rol ${companyUser.role} ` +
          `intentó acceder a ruta que requiere [${requiredRoles.join(', ')}] en compañía ${companyId}`
        );
        throw new ForbiddenException('Acceso denegado: Rol insuficiente para esta operación');
      }

      // Si el usuario tiene acceso, agregar información de rol y compañía al request
      request.companyContext = {
        companyId,
        userRole: companyUser.role,
        userId: user.id
      };
      
      return true;
    } catch (error) {
      // Si la excepción ya es un ForbiddenException, reenviarla
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error al validar roles de compañía: ${error.message}`, error.stack);
      throw new ForbiddenException('Error al validar permisos de acceso');
    }
  }
} 