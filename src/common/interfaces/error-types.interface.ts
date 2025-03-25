/**
 * Interfaces para tipado de errores
 */

/**
 * Códigos de error de la aplicación
 */
export enum ErrorCode {
  // Errores generales
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // Errores específicos de negocio
  DATA_SUBJECT_NOT_FOUND = 'DATA_SUBJECT_NOT_FOUND',
  CONSENT_NOT_FOUND = 'CONSENT_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * Interfaz base para errores de la aplicación
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  originalError?: any;
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