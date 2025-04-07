import { Injectable } from '@nestjs/common';

/**
 * Servicio de utilidades comunes para la aplicación
 */
@Injectable()
export class UtilsService {
  /**
   * Genera un ID único
   * @returns ID único
   */
  generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Formatea una fecha en ISO
   * @param date Fecha a formatear
   * @returns Fecha formateada
   */
  formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Sanitiza un string para evitar inyecciones
   * @param input String a sanitizar
   * @returns String sanitizado
   */
  sanitizeString(input: string): string {
    if (!input) return '';
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Valida un email
   * @param email Email a validar
   * @returns Verdadero si el email es válido
   */
  isValidEmail(email: string): boolean {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }

  /**
   * Convierte un objeto a camelCase
   * @param obj Objeto a convertir
   * @returns Objeto con propiedades en camelCase
   */
  toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(v => this.toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [this.toCamelCaseString(key)]: this.toCamelCase(obj[key]),
        }),
        {},
      );
    }
    return obj;
  }

  /**
   * Convierte un string a camelCase
   * @param str String a convertir
   * @returns String en camelCase
   */
  private toCamelCaseString(str: string): string {
    return str.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', ''),
    );
  }
} 