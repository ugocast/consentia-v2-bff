import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { CompanyContextGuard } from '../guards/company-context.guard';

export const COMPANY_CONTEXT_KEY = 'company_context';
export const SKIP_COMPANY_CONTEXT_KEY = 'skip_company_context';

export interface CompanyContextOptions {
  /** Permite acceso a múltiples compañías (ej. para reportes consolidados) */
  allowMultiple?: boolean;
  /** Requiere que el ID de compañía esté presente en los parámetros de ruta */
  requireInParams?: boolean;
  /** Requiere que el usuario tenga un rol específico en la compañía */
  requireRoles?: string[];
}

/**
 * Requiere que exista un contexto de empresa válido para acceder al endpoint.
 * @param options Opciones de configuración para el decorador
 */
export const RequireCompanyContext = (options: CompanyContextOptions = {}) => {
  return applyDecorators(
    SetMetadata(COMPANY_CONTEXT_KEY, options),
    UseGuards(CompanyContextGuard)
  );
};

/**
 * Marca un endpoint para que sea excluido de la validación de contexto de empresa.
 */
export const SkipCompanyContext = () => {
  return SetMetadata(SKIP_COMPANY_CONTEXT_KEY, true);
}; 