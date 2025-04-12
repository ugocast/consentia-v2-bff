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
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Errores relacionados con invitaciones
  INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  INVITATION_ALREADY_ACCEPTED = 'INVITATION_ALREADY_ACCEPTED',
  INVITATION_ALREADY_EXISTS = 'INVITATION_ALREADY_EXISTS',
  INVALID_INVITATION_STATUS = 'INVALID_INVITATION_STATUS',
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