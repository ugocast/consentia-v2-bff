#!/usr/bin/env node

/**
 * Script para generar nuevas pruebas siguiendo los estándares de prueba de Consentia
 * 
 * Uso: 
 * - Para pruebas unitarias: node scripts/generate-test.js unit path/to/file.ts
 * - Para pruebas E2E: node scripts/generate-test.js e2e feature-name
 */

const fs = require('fs');
const path = require('path');

// Plantillas
const CONTROLLER_TEST_TEMPLATE = `import { Test, TestingModule } from '@nestjs/testing';
import { {{ClassName}} } from './{{fileName}}';
import { {{ServiceName}} } from './{{serviceName}}';
// Uncomment and update imports as needed
// import { createFixture } from '../../test/__fixtures__/entity.fixture';

// Mock del servicio
const mock{{ServiceName}} = {
  // Define your mock methods here
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('{{ClassName}}', () => {
  let controller: {{ClassName}};

  beforeEach(async () => {
    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [{{ClassName}}],
      providers: [
        {
          provide: {{ServiceName}},
          useValue: mock{{ServiceName}},
        },
      ],
    }).compile();

    controller = module.get<{{ClassName}}>({{ClassName}});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of items when called', async () => {
      // Arrange
      const expectedResult = [{ id: '1', name: 'Test' }];
      mock{{ServiceName}}.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mock{{ServiceName}}.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors when service throws an exception', async () => {
      // Arrange
      const errorMessage = 'Database error';
      mock{{ServiceName}}.findAll.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow(errorMessage);
      expect(mock{{ServiceName}}.findAll).toHaveBeenCalled();
    });
  });

  // Add more test cases for other methods
});
`;

const SERVICE_TEST_TEMPLATE = `import { Test, TestingModule } from '@nestjs/testing';
import { {{ClassName}} } from './{{fileName}}';
// Uncomment and update imports as needed
// import { mockDrizzleClient, setupDrizzleResult } from '../common/mocks/drizzle.mock';
// import { mockSupabaseClient } from '../common/mocks/supabase.mock';
// import { createFixture } from '../../test/__fixtures__/entity.fixture';

describe('{{ClassName}}', () => {
  let service: {{ClassName}};

  beforeEach(async () => {
    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {{ClassName}},
        // Add mock providers if needed
      ],
    }).compile();

    service = module.get<{{ClassName}}>({{ClassName}});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all items when called', async () => {
      // Arrange
      const expectedItems = [{ id: '1', name: 'Test' }];
      
      // Configure your mocks here
      // Example: setupDrizzleResult(expectedItems);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expectedItems);
      // Add more assertions based on your implementation
    });

    it('should handle errors appropriately', async () => {
      // Arrange
      // Configure your mocks to throw an error
      
      // Act & Assert
      // Verify error handling logic
    });
  });

  // Add more test cases for other methods
});
`;

const E2E_TEST_TEMPLATE = `import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { testCleanup } from './__utils__/test-cleanup';
import { authenticatedApiRequest, UserRole } from './__utils__/auth-helpers';
import { responseValidators } from './__utils__/response-validators';
// Import fixtures and mocks as needed
// import { createEntityFixture } from './__fixtures__/entity.fixture';
// import { setupDrizzleE2EResult } from './__mocks__/drizzle.mock';

describe('{{FeatureName}} (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Configurar la aplicación
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Configurar limpieza automática
  afterEach(() => testCleanup.resetAllMocks());
  afterAll(async () => await testCleanup.closeApp(app));

  describe('/{{endpoint}} (GET)', () => {
    it('should return list of items when user is authenticated', async () => {
      // Arrange - Configurar usuario autenticado
      const userId = 'test-user-id';
      const companyId = 'test-company-id';
      const api = authenticatedApiRequest(app, userId);
      
      // Configurar datos de prueba
      // Ejemplo: const entities = createManyEntityFixtures(5, companyId);
      // Ejemplo: setupDrizzleE2EResult(entities);
      
      // Act - Realizar la petición
      const response = await api.get('/{{endpoint}}');
      
      // Assert - Validar la respuesta
      expect(response.status).toBe(200);
      // Ejemplo: const paginatedResponse = responseValidators.validatePaginatedResponse(response);
      
      // Validaciones adicionales específicas
    });

    it('should return 401 when user is not authenticated', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/{{endpoint}}')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      responseValidators.validateErrorResponse(response, 401);
    });
  });

  // Add more test cases for other endpoints
});
`;

// Función principal
async function generateTest() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Uso: node generate-test.js <unit|e2e> <path-or-feature>');
    process.exit(1);
  }

  const testType = args[0];
  const target = args[1];

  if (testType === 'unit') {
    await generateUnitTest(target);
  } else if (testType === 'e2e') {
    await generateE2ETest(target);
  } else {
    console.error('Tipo de prueba no válido. Use "unit" o "e2e".');
    process.exit(1);
  }
}

async function generateUnitTest(filePath) {
  if (!filePath.endsWith('.ts')) {
    console.error('Debe proporcionar un archivo .ts para generar una prueba unitaria');
    process.exit(1);
  }

  // Determinar si es un controlador o un servicio
  const isController = filePath.includes('controller');
  const templateToUse = isController ? CONTROLLER_TEST_TEMPLATE : SERVICE_TEST_TEMPLATE;

  // Calcular nombres de clase y archivo
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);
  const fileNameWithoutExt = fileName.replace('.ts', '');
  
  // Convencion de nombrado para clase (camelCase to PascalCase)
  const className = fileNameWithoutExt
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  let serviceName = '';
  if (isController) {
    serviceName = className.replace('Controller', 'Service');
  }

  // Generar contenido reemplazando placeholders
  let content = templateToUse
    .replace(/{{ClassName}}/g, className)
    .replace(/{{fileName}}/g, fileNameWithoutExt)
    .replace(/{{serviceName}}/g, fileNameWithoutExt.replace('controller', 'service'));
  
  if (isController) {
    content = content.replace(/{{ServiceName}}/g, serviceName);
  }

  // Crear archivo de prueba
  const testFilePath = path.join(process.cwd(), dirPath, `${fileNameWithoutExt}.spec.ts`);
  
  if (fs.existsSync(testFilePath)) {
    console.error(`El archivo de prueba ya existe: ${testFilePath}`);
    process.exit(1);
  }

  fs.writeFileSync(testFilePath, content);
  console.log(`Archivo de prueba generado: ${testFilePath}`);
}

async function generateE2ETest(featureName) {
  // Calcular nombres para el archivo de prueba
  const kebabCaseFeature = featureName.toLowerCase().replace(/\s+/g, '-');
  const pascalCaseFeature = featureName
    .split(/[-\s]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Generar endpoint a partir del nombre
  const endpoint = kebabCaseFeature.includes('-') ? kebabCaseFeature : `${kebabCaseFeature}s`;

  // Generar contenido reemplazando placeholders
  const content = E2E_TEST_TEMPLATE
    .replace(/{{FeatureName}}/g, pascalCaseFeature)
    .replace(/{{endpoint}}/g, endpoint);

  // Crear archivo de prueba
  const testFilePath = path.join(process.cwd(), 'test', `${kebabCaseFeature}.e2e-spec.ts`);
  
  if (fs.existsSync(testFilePath)) {
    console.error(`El archivo de prueba ya existe: ${testFilePath}`);
    process.exit(1);
  }

  fs.writeFileSync(testFilePath, content);
  console.log(`Archivo de prueba E2E generado: ${testFilePath}`);
}

// Ejecutar función principal
generateTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 