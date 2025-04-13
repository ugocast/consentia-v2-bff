/**
 * Interfaces para tipado de errores
 */

/**
 * Códigos de error estandarizados para toda la aplicación
 */
export enum ErrorCode {
  // Errores generales
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Errores específicos de negocio
  DATA_SUBJECT_NOT_FOUND = 'DATA_SUBJECT_NOT_FOUND',
  CONSENT_NOT_FOUND = 'CONSENT_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Errores relacionados con invitaciones
  INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  INVITATION_ALREADY_ACCEPTED = 'INVITATION_ALREADY_ACCEPTED',
  INVITATION_ALREADY_EXISTS = 'INVITATION_ALREADY_EXISTS',
  INVALID_INVITATION_STATUS = 'INVALID_INVITATION_STATUS',
  
  // Errores de autenticación de Supabase
  SUPABASE_AUTH_ERROR = 'SUPABASE_AUTH_ERROR',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  PASSWORD_RECOVERY_REQUIRED = 'PASSWORD_RECOVERY_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_MFA_CODE = 'INVALID_MFA_CODE',
  PASSWORD_NOT_STRONG_ENOUGH = 'PASSWORD_NOT_STRONG_ENOUGH',
  
  // Errores de recursos o servicios externos
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION'
}

/**
 * Interfaz base para errores de la aplicación
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Errores relacionados con la base de datos
 */
export interface DatabaseError extends AppError {
  code: ErrorCode.DATABASE_ERROR;
  operation?: string;
  table?: string;
}

/**
 * Errores de validación de datos
 */
export interface ValidationError extends AppError {
  code: ErrorCode.VALIDATION_ERROR;
  fields: {
    field: string;
    error: string;
  }[];
}

/**
 * Errores relacionados con autenticación
 */
export interface AuthError extends AppError {
  code: ErrorCode.UNAUTHORIZED | ErrorCode.INVALID_TOKEN | ErrorCode.TOKEN_EXPIRED | ErrorCode.SUPABASE_AUTH_ERROR;
  originalError?: string;
}

/**
 * Mapea códigos de error de Supabase a códigos de error internos
 * @param supabaseError Código de error de Supabase
 * @returns Código de error interno correspondiente
 */
export function mapSupabaseErrorToErrorCode(supabaseError: string): ErrorCode {
  const errorMap: Record<string, ErrorCode> = {
    'invalid_credentials': ErrorCode.INVALID_CREDENTIALS,
    'email_not_confirmed': ErrorCode.EMAIL_NOT_CONFIRMED,
    'user_not_found': ErrorCode.USER_NOT_FOUND,
    'invalid_token': ErrorCode.INVALID_TOKEN,
    'expired_token': ErrorCode.TOKEN_EXPIRED,
    'rate_limit_exceeded': ErrorCode.RATE_LIMIT_EXCEEDED,
  };

  return errorMap[supabaseError] || ErrorCode.SUPABASE_AUTH_ERROR;
} 