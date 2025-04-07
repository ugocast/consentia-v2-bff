/**
 * Mocks específicos para Drizzle en pruebas E2E
 */

// Mock para el cliente de Drizzle en E2E
export const mockDrizzleClient = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  and: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue([]),
};

// Función para configurar resultados mockeados en E2E
export function setupDrizzleE2EResult<T = any>(result: T | T[]) {
  mockDrizzleClient.execute.mockResolvedValue(Array.isArray(result) ? result : [result]);
  mockDrizzleClient.returning.mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(Array.isArray(result) ? result : [result])
  }));
}

// Crear un mock para el módulo drizzle-orm
export const mockDrizzle = jest.fn().mockReturnValue(mockDrizzleClient);

// Función para resetear todos los mocks de Drizzle para E2E
export function resetDrizzleE2EMocks() {
  jest.clearAllMocks();
  
  // Restaurar implementaciones
  Object.keys(mockDrizzleClient).forEach(key => {
    if (typeof mockDrizzleClient[key] === 'function') {
      mockDrizzleClient[key].mockClear();
      
      // Restaurar encadenamiento
      if (key !== 'execute' && key !== 'returning') {
        mockDrizzleClient[key].mockReturnThis();
      }
    }
  });
  
  mockDrizzleClient.execute.mockResolvedValue([]);
  mockDrizzleClient.returning.mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue([])
  }));
}

/**
 * Utilidad para configurar datos de prueba específicos
 */
export const setupCompany = (companyId: string, name: string = `Test Company ${companyId}`) => {
  const companyData = {
    id: companyId,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active: true
  };
  
  setupDrizzleE2EResult(companyData);
  
  return companyData;
};

/**
 * Utilidad para configurar datos de usuario de compañía
 */
export const setupCompanyUser = (userId: string, companyId: string, role: string = 'member') => {
  const companyUserData = {
    id: `${userId}-${companyId}`,
    user_id: userId,
    company_id: companyId,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active: true
  };
  
  setupDrizzleE2EResult(companyUserData);
  
  return companyUserData;
}; 