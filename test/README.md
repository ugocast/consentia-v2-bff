# Guía de Pruebas Unitarias para Consentia BFF

Este documento proporciona una guía completa para ejecutar y ampliar las pruebas unitarias para el Backend For Frontend (BFF) de Consentia.

## Índice

1. [Configuración del entorno](#configuración-del-entorno)
2. [Ejecución de pruebas](#ejecución-de-pruebas)
3. [Estructura de pruebas](#estructura-de-pruebas)
4. [Mocks disponibles](#mocks-disponibles)
5. [Utilidades de prueba](#utilidades-de-prueba)
6. [Patrones para escribir pruebas](#patrones-para-escribir-pruebas)
7. [Buenas prácticas](#buenas-prácticas)

## Configuración del entorno

Antes de ejecutar las pruebas, asegúrate de tener instaladas todas las dependencias:

```bash
npm install
```

## Ejecución de pruebas

### Ejecutar todas las pruebas

```bash
npm test
```

### Ejecutar pruebas con cobertura

```bash
npm run test:cov
```

### Ejecutar pruebas en modo watch

```bash
npm run test:watch
```

### Ejecutar pruebas de un archivo específico

```bash
npm test -- src/users/users.service.spec.ts
```

### Ejecutar pruebas de un módulo específico

```bash
npm test -- src/users
```

## Estructura de pruebas

Las pruebas siguen la misma estructura de directorios que el código fuente. Cada archivo de prueba tiene el sufijo `.spec.ts` y está ubicado junto al archivo que está probando.

```
src/
├── users/
│   ├── users.service.ts
│   ├── users.service.spec.ts
│   ├── users.controller.ts
│   └── users.controller.spec.ts
├── data-types/
│   ├── data-types.service.ts
│   ├── data-types.service.spec.ts
│   ├── data-types.controller.ts
│   └── data-types.controller.spec.ts
```

## Mocks disponibles

### Mock de Supabase

Ubicación: `src/common/mocks/supabase.mock.ts`

Este mock proporciona simulaciones para las funciones de Supabase, incluyendo:
- Autenticación
- Operaciones de base de datos
- Almacenamiento

Ejemplo de uso:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { mockSupabaseClient, mockCreateSupabaseClient } from '../common/mocks/supabase.mock';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configurar el mock para createSupabaseClient
    mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should call Supabase correctly', async () => {
    // Configurar el comportamiento del mock
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.eq.mockResolvedValue({
      data: [{ id: '1', name: 'Test' }],
      error: null
    });

    // Llamar al método del servicio
    const result = await service.findSomething('1');

    // Verificar llamadas
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('your_table');
    expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
  });
});
```

### Mock de Drizzle

Ubicación: `src/common/mocks/drizzle.mock.ts`

Este mock proporciona simulaciones para las funciones de Drizzle ORM, basadas en el schema definido.

Ejemplo de uso:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { mockDrizzleClient, mockDrizzle, setupDrizzleResult } from '../common/mocks/drizzle.mock';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should query data correctly', async () => {
    // Configurar resultados simulados
    setupDrizzleResult([
      { id: '1', name: 'Test' },
      { id: '2', name: 'Test 2' }
    ]);

    // Llamar al método del servicio
    const result = await service.findAll();

    // Verificar llamadas
    expect(mockDrizzleClient.select).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });
});
```

## Utilidades de prueba

### Test Data Generators

Ubicación: `src/common/testing/test-utils.ts`

Este archivo proporciona funciones de utilidad para generar datos de prueba para diferentes entidades:

- `authTestData`: Datos para pruebas de autenticación
- `companyTestData`: Datos para pruebas de empresas
- `consentTestData`: Datos para pruebas de consentimientos
- `jwtTestUtils`: Utilidades para pruebas con JWT

Ejemplo de uso:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourController } from './your.controller';
import { YourService } from './your.service';
import { authTestData, jwtTestUtils } from '../common/testing/test-utils';

describe('YourController', () => {
  let controller: YourController;
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YourController],
      providers: [
        {
          provide: YourService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<YourController>(YourController);
    service = module.get<YourService>(YourService);
  });

  it('should handle authenticated requests', async () => {
    // Crear un mock de request con usuario autenticado
    const mockRequest = jwtTestUtils.createMockRequestWithUser();
    
    // Configurar el servicio mock
    const mockUser = authTestData.createMockUser();
    jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
    
    // Llamar al método del controlador
    const result = await controller.getProfile(mockRequest);
    
    // Verificar que se llamó al servicio con el ID correcto
    expect(service.findOne).toHaveBeenCalledWith(mockRequest.user.id);
  });
});
```

## Patrones para escribir pruebas

### 1. Patrón AAA (Arrange-Act-Assert)

Todas las pruebas deben seguir el patrón AAA:

```typescript
it('should do something', async () => {
  // Arrange - configurar el escenario de prueba
  const input = { /* ... */ };
  mockService.method.mockResolvedValue(expectedOutput);

  // Act - ejecutar el código que se está probando
  const result = await controller.method(input);

  // Assert - verificar que el resultado es el esperado
  expect(mockService.method).toHaveBeenCalledWith(input);
  expect(result).toEqual(expectedOutput);
});
```

### 2. Pruebas de casos felices y casos de error

Para cada método, probar tanto el camino feliz como los casos de error:

```typescript
describe('create', () => {
  it('should create an entity successfully', async () => {
    // Prueba del caso feliz
  });

  it('should throw an error when validation fails', async () => {
    // Prueba del caso de error
  });
});
```

### 3. Aislamiento de dependencias

Utilizar mocks para aislar la unidad que se está probando:

```typescript
const mockDependency = {
  method: jest.fn(),
};

beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      YourService,
      {
        provide: Dependency,
        useValue: mockDependency,
      },
    ],
  }).compile();
});
```

## Buenas prácticas

1. **Limpiar mocks**: Utilizar `jest.clearAllMocks()` en el `beforeEach` para asegurar que las pruebas sean independientes.

2. **Especificidad en las pruebas**: Cada prueba debe verificar un comportamiento específico.

3. **Nombres descriptivos**: Los nombres de las pruebas deben describir claramente lo que se está probando.

4. **Evitar estados compartidos**: Las pruebas no deben depender del orden de ejecución o compartir estado.

5. **Utilizar factories y utilidades**: Aprovechar las utilidades de test-utils.ts para generar datos de prueba.

6. **Cubrir casos edge**: Probar límites y casos especiales, no solo el camino feliz.

7. **Mantener la cobertura alta**: Apuntar a una cobertura de pruebas de al menos 80%.

8. **Mantener las pruebas rápidas**: Evitar dependencias externas o operaciones lentas.

## Ejemplos completos

Puedes encontrar ejemplos completos de pruebas en:

- `src/users/users.service.spec.ts`
- `src/users/users.controller.spec.ts`
- `src/data-types/data-types.service.spec.ts`
- `src/data-types/data-types.controller.spec.ts`
- `src/auth/auth.service.spec.ts`
- `src/auth/auth.controller.spec.ts`

## Nueva Estructura de Pruebas (2023)

Como parte de las mejoras en el mantenimiento y escalabilidad del código, hemos implementado una nueva estructura para las pruebas:

### Nuevos Directorios

- `test/__fixtures__/`: Contiene factory functions para crear datos de prueba reutilizables
- `test/__utils__/`: Contiene utilidades para las pruebas E2E
- `test/__mocks__/`: Contiene mocks específicos para pruebas E2E

### Documentación Estándar

Hemos añadido nuevos documentos de referencia:

- `test/__utils__/testing-standards.md`: Describe los estándares de pruebas que deben seguirse
- `test/__utils__/test-templates.md`: Plantillas para crear nuevas pruebas unitarias y E2E

### Nuevas Características (Fase 2)

En la segunda fase de la estandarización, hemos ampliado las capacidades:

#### Fixtures para Todas las Entidades

Ahora disponemos de factory functions para crear datos de prueba para todas las entidades principales:
- Usuarios
- Compañías
- Sujetos de datos
- Tipos de consentimiento
- Consentimientos

#### Utilidades Mejoradas

Se han añadido utilidades para casos de uso comunes:
- `auth-helpers.ts`: Funciones para configurar usuarios con diferentes roles
- `response-validators.ts`: Validadores para respuestas comunes de API
- `test-cleanup.ts`: Helpers para limpieza automática entre pruebas

#### Ejemplos de Uso

Consulta `test/__utils__/phase2-implementation.md` para ver ejemplos completos de cómo usar las nuevas utilidades en tus pruebas E2E.

### Refactorización y CI/CD (Fase 3)

En la tercera fase de la estandarización, hemos consolidado la implementación:

#### Refactorización de Pruebas Existentes

Hemos aplicado los estándares definidos a las pruebas existentes:
- Migración a fixtures para datos de prueba
- Uso consistente del patrón AAA (Arrange-Act-Assert)
- Nombres descriptivos para las pruebas
- Eliminación de hacks y sobrescrituras de métodos
- Agregado pruebas para casos de error

#### Integración con CI/CD

Se ha configurado un flujo de trabajo en GitHub Actions para automatizar:
- Ejecución de pruebas unitarias y E2E en cada PR
- Verificación de umbral mínimo de cobertura (80%)
- Generación de informes de cobertura
- Comentarios automáticos en PRs

Para más detalles sobre la implementación, consulta:
- `test/__utils__/phase3-implementation.md`: Guía detallada de la Fase 3
- `.github/workflows/test.yml`: Configuración del flujo de trabajo de CI/CD

### Próximos Pasos

Como parte de este esfuerzo de estandarización, estaremos:

1. Continuando con la refactorización de pruebas existentes
2. Expandiendo la cobertura en áreas críticas
3. Implementando pruebas de integración con servicios externos
4. Explorando pruebas de rendimiento para escenarios clave

Para más información, consulta los documentos de estándares y plantillas en el directorio `test/__utils__/`. 