import { v4 as uuidv4 } from 'uuid';

/**
 * Factory function para crear datos de compañía para pruebas
 */
export const createCompanyFixture = (overrides: Partial<CompanyFixture> = {}): CompanyFixture => {
  const id = overrides.id || uuidv4();
  
  return {
    id,
    name: overrides.name || `Company ${id.slice(0, 5)}`,
    description: overrides.description || `Description for company ${id.slice(0, 5)}`,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    active: overrides.active !== undefined ? overrides.active : true,
    ...overrides
  };
};

/**
 * Factory function para crear datos de usuario de compañía
 */
export const createCompanyUserFixture = (
  overrides: Partial<CompanyUserFixture> = {}
): CompanyUserFixture => {
  const id = overrides.id || uuidv4();
  const userId = overrides.user_id || uuidv4();
  const companyId = overrides.company_id || uuidv4();
  
  return {
    id,
    user_id: userId,
    company_id: companyId,
    role: overrides.role || 'member',
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    active: overrides.active !== undefined ? overrides.active : true,
    ...overrides
  };
};

/**
 * Crear múltiples compañías para pruebas
 */
export const createManyCompanyFixtures = (
  count: number,
  overrides: Partial<CompanyFixture> = {}
): CompanyFixture[] => {
  return Array.from({ length: count }, (_, index) => 
    createCompanyFixture({ 
      name: overrides.name || `Company ${index}`,
      description: overrides.description || `Description for company ${index}`,
      ...overrides
    })
  );
};

/**
 * Crear múltiples usuarios de compañía para pruebas
 */
export const createManyCompanyUserFixtures = (
  count: number,
  companyId: string,
  overrides: Partial<CompanyUserFixture> = {}
): CompanyUserFixture[] => {
  return Array.from({ length: count }, (_, index) => 
    createCompanyUserFixture({
      company_id: companyId,
      ...overrides
    })
  );
};

/**
 * Interfaces para los fixtures
 */
export interface CompanyFixture {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  [key: string]: any;
}

export interface CompanyUserFixture {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  [key: string]: any;
} 