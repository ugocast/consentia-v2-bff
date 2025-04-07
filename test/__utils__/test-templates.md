# Plantillas para Pruebas de Consentia BFF

## Plantilla para Pruebas Unitarias (.spec.ts)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
// Importar mocks necesarios
import { mockDependency } from '../../common/mocks/dependency.mock';

// Si es necesario, mockear dependencias externas
jest.mock('../../path/to/dependency', () => ({
  someFunction: jest.fn(),
}));

describe('YourService', () => {
  let service: YourService;
  
  // Configuración que se ejecuta antes de cada prueba
  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar mocks si es necesario
    mockDependency.method.mockReturnValue(expectedValue);
    
    // Crear el módulo de prueba
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        // Proporcionar mocks para las dependencias
        {
          provide: DependencyService,
          useValue: mockDependency,
        },
      ],
    }).compile();
    
    service = module.get<YourService>(YourService);
  });
  
  // Prueba básica de existencia
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  // Agrupar pruebas por método
  describe('methodName', () => {
    it('should return expected result when valid input is provided', async () => {
      // Arrange - configurar el escenario de prueba
      const input = { /* datos de entrada */ };
      const expectedOutput = { /* resultado esperado */ };
      
      // Act - ejecutar el método a probar
      const result = await service.methodName(input);
      
      // Assert - verificar que el resultado es el esperado
      expect(result).toEqual(expectedOutput);
      expect(mockDependency.method).toHaveBeenCalledWith(expect.any(String));
    });
    
    it('should throw an error when invalid input is provided', async () => {
      // Arrange
      const invalidInput = { /* datos inválidos */ };
      
      // Act & Assert - verificar que se lanza la excepción esperada
      await expect(service.methodName(invalidInput)).rejects.toThrow(ExpectedException);
    });
  });
});
```

## Plantilla para Pruebas E2E (.e2e-spec.ts)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
// Importar mocks y fixtures
import { mockDependency } from '../src/common/mocks/dependency.mock';
import { createTestData } from './__fixtures__/test-data.fixture';

// Mockear dependencias externas si es necesario
jest.mock('../src/path/to/dependency', () => ({
  someFunction: jest.fn(),
}));

describe('YourController (e2e)', () => {
  let app: INestApplication;
  const mockToken = 'Bearer valid-token';
  
  // Configuración que se ejecuta antes de cada prueba
  beforeEach(async () => {
    // Resetear todos los mocks
    jest.clearAllMocks();
    
    // Configurar mocks si es necesario
    mockDependency.method.mockResolvedValue({ /* datos mockeados */ });
    
    // Crear y configurar la aplicación
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    // Configuración adicional de la app si es necesaria
    await app.init();
  });
  
  // Agrupar pruebas por endpoint/ruta
  describe('/your-endpoint (GET)', () => {
    it('should return expected data when valid request is made', () => {
      // Arrange
      const expectedResponse = { /* datos esperados */ };
      
      // Act & Assert
      return request(app.getHttpServer())
        .get('/your-endpoint')
        .set('Authorization', mockToken)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(expectedResponse);
        });
    });
    
    it('should return 401 when token is invalid', () => {
      // Act & Assert
      return request(app.getHttpServer())
        .get('/your-endpoint')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
  
  // Limpiar recursos después de todas las pruebas
  afterAll(async () => {
    await app.close();
  });
});
``` 