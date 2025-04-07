import { v4 as uuidv4 } from 'uuid';

/**
 * Factory function para crear datos de tipo de consentimiento para pruebas
 */
export const createConsentTypeFixture = (overrides: Partial<ConsentTypeFixture> = {}): ConsentTypeFixture => {
  const id = overrides.id || uuidv4();
  const companyId = overrides.company_id || uuidv4();
  
  return {
    id,
    name: overrides.name || `Consent Type ${id.slice(0, 5)}`,
    description: overrides.description || `Description for consent type ${id.slice(0, 5)}`,
    company_id: companyId,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    active: overrides.active !== undefined ? overrides.active : true,
    ...overrides
  };
};

/**
 * Crear múltiples tipos de consentimiento para pruebas
 */
export const createManyConsentTypeFixtures = (
  count: number, 
  companyId: string = uuidv4(),
  overrides: Partial<ConsentTypeFixture> = {}
): ConsentTypeFixture[] => {
  return Array.from({ length: count }, (_, index) => 
    createConsentTypeFixture({ 
      company_id: companyId,
      name: overrides.name || `Consent Type ${index}`,
      description: overrides.description || `Description for consent type ${index}`,
      ...overrides
    })
  );
};

/**
 * Interfaces para los fixtures
 */
export interface ConsentTypeFixture {
  id: string;
  name: string;
  description: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  [key: string]: any;
} 