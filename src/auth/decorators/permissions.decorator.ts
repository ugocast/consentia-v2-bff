import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums/permission.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

// Decorador que requiere todos los permisos especificados
export const RequireAllPermissions = (...permissions: Permission[]) => 
  SetMetadata(PERMISSIONS_KEY, { all: permissions });

// Decorador que requiere al menos uno de los permisos especificados
export const RequireAnyPermission = (...permissions: Permission[]) => 
  SetMetadata(PERMISSIONS_KEY, { any: permissions }); 