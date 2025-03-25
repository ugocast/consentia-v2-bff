import { HttpStatus } from '@nestjs/common';

/**
 * DTO para respuestas estándar de la API
 */
export class StandardResponseDto<T> {
  /**
   * Código de estado HTTP
   */
  statusCode: HttpStatus;

  /**
   * Mensaje descriptivo de la respuesta
   */
  message: string;

  /**
   * Datos de la respuesta (opcional)
   */
  data?: T;

  /**
   * Marca de tiempo de la respuesta
   */
  timestamp: string;

  /**
   * Constructor
   * @param statusCode Código de estado HTTP
   * @param message Mensaje descriptivo
   * @param data Datos de la respuesta (opcional)
   */
  constructor(statusCode: HttpStatus, message: string, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Crea una respuesta exitosa (status 200)
   * @param message Mensaje de éxito
   * @param data Datos de la respuesta
   * @returns Una instancia de StandardResponseDto
   */
  static success<T>(message: string, data?: T): StandardResponseDto<T> {
    return new StandardResponseDto<T>(HttpStatus.OK, message, data);
  }

  /**
   * Crea una respuesta para recurso creado (status 201)
   * @param message Mensaje de éxito
   * @param data Datos del recurso creado
   * @returns Una instancia de StandardResponseDto
   */
  static created<T>(message: string, data?: T): StandardResponseDto<T> {
    return new StandardResponseDto<T>(HttpStatus.CREATED, message, data);
  }

  /**
   * Crea una respuesta de error
   * @param statusCode Código de estado HTTP de error
   * @param message Mensaje de error
   * @returns Una instancia de StandardResponseDto
   */
  static error(statusCode: HttpStatus, message: string): StandardResponseDto<null> {
    return new StandardResponseDto<null>(statusCode, message);
  }
} 