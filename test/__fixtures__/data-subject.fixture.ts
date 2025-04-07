import { v4 as uuidv4 } from 'uuid';

/**
 * Factory function para crear datos de sujeto de datos para pruebas
 */
export const createDataSubjectFixture = (overrides: Partial<DataSubjectFixture> = {}): DataSubjectFixture => {
  const id = overrides.id || uuidv4();
  const companyId = overrides.company_id || uuidv4();
  
  return {
    id,
    company_id: companyId,
    email: overrides.email || `subject-${id.slice(0, 5)}@example.com`,
    first_name: overrides.first_name || `Subject ${id.slice(0, 3)}`,
    last_name: overrides.last_name || `Last ${id.slice(3, 6)}`,
    phone: overrides.phone || `+123456${id.slice(0, 4)}`,
    external_id: overrides.external_id || `EXT-${id.slice(0, 8)}`,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    active: overrides.active !== undefined ? overrides.active : true,
    metadata: overrides.metadata || { source: 'testing' },
    ...overrides
  };
};

/**
 * Crear múltiples sujetos de datos para pruebas
 */
export const createManyDataSubjectFixtures = (
  count: number,
  companyId: string = uuidv4(),
  overrides: Partial<DataSubjectFixture> = {}
): DataSubjectFixture[] => {
  return Array.from({ length: count }, (_, index) => 
    createDataSubjectFixture({ 
      company_id: companyId,
      email: overrides.email || `subject-${index}@example.com`,
      first_name: overrides.first_name || `Subject ${index}`,
      last_name: overrides.last_name || `Last ${index}`,
      ...overrides
    })
  );
};

/**
 * Interfaces para los fixtures
 */
export interface DataSubjectFixture {
  id: string;
  company_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  metadata?: Record<string, any>;
  [key: string]: any;
} 