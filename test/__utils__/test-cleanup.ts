import { INestApplication } from '@nestjs/common';
import { mockSupabaseClient } from '../__mocks__/supabase.mock';
import { mockDrizzleClient } from '../__mocks__/drizzle.mock';

/**
 * Utilidades para limpiar datos de prueba después de pruebas E2E
 */
export const testCleanup = {
  /**
   * Resetear todos los mocks utilizados en las pruebas
   */
  resetAllMocks: () => {
    jest.clearAllMocks();
    
    // Limpiar mock de Supabase
    Object.keys(mockSupabaseClient).forEach(key => {
      if (typeof mockSupabaseClient[key] === 'function') {
        mockSupabaseClient[key].mockClear();
      }
    });
    
    // Limpiar mock de Drizzle
    Object.keys(mockDrizzleClient).forEach(key => {
      if (typeof mockDrizzleClient[key] === 'function') {
        mockDrizzleClient[key].mockClear();
      }
    });
  },
  
  /**
   * Cerrar la aplicación NestJS después de las pruebas
   */
  closeApp: async (app: INestApplication) => {
    if (app) {
      await app.close();
    }
  },
  
  /**
   * Configurar los hooks de Jest para limpiar automáticamente
   * 
   * Ejemplo de uso:
   * ```typescript
   * // En tu archivo de prueba
   * import { testCleanup } from '../__utils__/test-cleanup';
   * 
   * let app: INestApplication;
   * 
   * beforeEach(async () => {
   *   // Configurar la app...
   * });
   * 
   * afterEach(() => testCleanup.resetAllMocks());
   * afterAll(async () => await testCleanup.closeApp(app));
   * ```
   */
  setupJestHooks: (app: INestApplication) => {
    afterEach(() => testCleanup.resetAllMocks());
    afterAll(async () => await testCleanup.closeApp(app));
  }
}; 