import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user',
}

export const ROLES_KEY = 'roles';

/**
 * Decorador para definir roles requeridos para un endpoint
 * @example
 * @Roles(Role.ADMIN)
 * @Get('admin-only')
 * getAdminData() {
 *   return 'Admin data';
 * }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles); 