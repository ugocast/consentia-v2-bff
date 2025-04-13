import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../interfaces/error-types.interface';

/**
 * Filtro global para gestionar excepciones HTTP de forma consistente
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    // Obtener la respuesta original
    const exceptionResponse = exception.getResponse() as any;
    
    // Extraer información útil
    let errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR;
    let message = 'Ha ocurrido un error inesperado';
    let metadata: Record<string, any> = {};
    
    // Si la respuesta original es un objeto bien formateado con código de error
    if (typeof exceptionResponse === 'object' && exceptionResponse.code) {
      errorCode = exceptionResponse.code;
      message = exceptionResponse.message || message;
      metadata = exceptionResponse.metadata || {};
    } 
    // Si es solo un mensaje de error
    else if (typeof exceptionResponse === 'string' || (typeof exceptionResponse === 'object' && exceptionResponse.message)) {
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse.message || message);
        
      // Mapear el código HTTP al código de error
      switch (status) {
        case HttpStatus.UNAUTHORIZED:
          errorCode = ErrorCode.UNAUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          errorCode = ErrorCode.FORBIDDEN;
          break;
        case HttpStatus.NOT_FOUND:
          errorCode = ErrorCode.NOT_FOUND;
          break;
        case HttpStatus.CONFLICT:
          errorCode = ErrorCode.CONFLICT;
          break;
        case HttpStatus.UNPROCESSABLE_ENTITY:
        case HttpStatus.BAD_REQUEST:
          errorCode = ErrorCode.VALIDATION_ERROR;
          // Si hay errores de validación, incluirlos en los metadatos
          if (exceptionResponse.errors || exceptionResponse.validationErrors) {
            metadata.validationErrors = exceptionResponse.errors || exceptionResponse.validationErrors;
          }
          break;
        default:
          errorCode = ErrorCode.UNKNOWN_ERROR;
      }
    }
    
    // Registrar el error en los logs (excepto 401 y 403 que pueden ser demasiado frecuentes)
    if (status !== HttpStatus.UNAUTHORIZED && status !== HttpStatus.FORBIDDEN) {
      this.logger.error(`Exception: ${JSON.stringify({
        status,
        errorCode,
        message,
        path: request.url,
        method: request.method,
        metadata
      })}`);
    } else {
      this.logger.debug(`Auth Exception: ${errorCode} - ${message} - ${request.url}`);
    }
    
    // Construir respuesta estandarizada
    const responseBody = {
      statusCode: status,
      code: errorCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(Object.keys(metadata).length ? { metadata } : {})
    };
    
    response
      .status(status)
      .json(responseBody);
  }
}
