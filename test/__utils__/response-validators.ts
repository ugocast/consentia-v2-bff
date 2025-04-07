import * as supertest from 'supertest';
import { Response } from 'supertest';

/**
 * Tipos de respuestas comunes en la API
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Validadores para respuestas comunes
 */
export const responseValidators = {
  /**
   * Valida que una respuesta tenga la estructura de paginación correcta
   */
  validatePaginatedResponse: <T = any>(response: Response, expectedTotal?: number) => {
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    
    if (expectedTotal !== undefined) {
      expect(response.body.meta.total).toBe(expectedTotal);
    }
    
    return response.body as PaginatedResponse<T>;
  },
  
  /**
   * Valida que una respuesta tenga un error con el código de estado esperado
   */
  validateErrorResponse: (response: Response, expectedStatus: number, expectedMessage?: string) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('error');
    
    if (expectedMessage) {
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain(expectedMessage);
    }
    
    return response.body;
  },
  
  /**
   * Valida un objeto de consentimiento en una respuesta
   */
  validateConsentResponse: (consent: any) => {
    expect(consent).toHaveProperty('id');
    expect(consent).toHaveProperty('data_subject_id');
    expect(consent).toHaveProperty('consent_type_id');
    expect(consent).toHaveProperty('company_id');
    expect(consent).toHaveProperty('status');
    expect(consent).toHaveProperty('obtained_via');
    expect(consent).toHaveProperty('obtained_at');
    expect(consent).toHaveProperty('created_at');
    expect(consent).toHaveProperty('updated_at');
    
    return consent;
  },
  
  /**
   * Valida un objeto de sujeto de datos en una respuesta
   */
  validateDataSubjectResponse: (dataSubject: any) => {
    expect(dataSubject).toHaveProperty('id');
    expect(dataSubject).toHaveProperty('company_id');
    expect(dataSubject).toHaveProperty('email');
    expect(dataSubject).toHaveProperty('first_name');
    expect(dataSubject).toHaveProperty('last_name');
    expect(dataSubject).toHaveProperty('created_at');
    expect(dataSubject).toHaveProperty('updated_at');
    
    return dataSubject;
  },
  
  /**
   * Valida un objeto de usuario en una respuesta
   */
  validateUserResponse: (user: any) => {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    
    return user;
  },
  
  /**
   * Valida un objeto de compañía en una respuesta
   */
  validateCompanyResponse: (company: any) => {
    expect(company).toHaveProperty('id');
    expect(company).toHaveProperty('name');
    expect(company).toHaveProperty('created_at');
    expect(company).toHaveProperty('updated_at');
    
    return company;
  }
}; 