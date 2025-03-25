import { HttpStatus } from '@nestjs/common';

/**
 * DTO base para respuestas estándar de la API.
 */
export class StandardResponseDto<T> {
  /**
   * Código de estado HTTP de la respuesta.
   */
  statusCode: HttpStatus;

  /**
   * Mensaje descriptivo de la respuesta.
   */
  message: string;

  /**
   * Datos de la respuesta.
   */
  data?: T;

  /**
   * Marca de tiempo de la respuesta.
   */
  timestamp: string;

  /**
   * Constructor para una respuesta estándar.
   * 
   * @param statusCode Código HTTP
   * @param message Mensaje descriptivo
   * @param data Datos de respuesta (opcional)
   */
  constructor(statusCode: HttpStatus, message: string, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Crea una respuesta de éxito.
   * 
   * @param message Mensaje de éxito
   * @param data Datos a incluir
   * @returns Objeto StandardResponseDto
   */
  static success<T>(message: string, data?: T): StandardResponseDto<T> {
    return new StandardResponseDto<T>(HttpStatus.OK, message, data);
  }

  /**
   * Crea una respuesta para creación exitosa.
   * 
   * @param message Mensaje de éxito
   * @param data Datos del recurso creado
   * @returns Objeto StandardResponseDto
   */
  static created<T>(message: string, data?: T): StandardResponseDto<T> {
    return new StandardResponseDto<T>(HttpStatus.CREATED, message, data);
  }

  /**
   * Crea una respuesta para error.
   * 
   * @param statusCode Código de error HTTP
   * @param message Mensaje de error
   * @returns Objeto StandardResponseDto
   */
  static error(statusCode: HttpStatus, message: string): StandardResponseDto<null> {
    return new StandardResponseDto<null>(statusCode, message);
  }
} 