# Estándares de Pruebas para Consentia BFF

Este documento define los estándares y mejores prácticas para escribir pruebas en el proyecto Consentia BFF.

## Estructura de Directorios

```
consentia-bff/
├── src/
│   ├── module1/
│   │   ├── module1.service.ts
│   │   ├── module1.service.spec.ts  # Pruebas unitarias
│   │   └── ...
│   └── ...
├── test/
│   ├── __fixtures__/                # Datos de prueba compartidos
│   ├── __mocks__/                   # Mocks compartidos para E2E
│   ├── __utils__/                   # Utilidades de prueba E2E
│   ├── module1.e2e-spec.ts
│   └── ...
```

## Pruebas Unitarias

### Ubicación y Nomenclatura
- Las pruebas unitarias se ubican junto al archivo que prueban con el sufijo `.spec.ts`
- Los nombres de los archivos de prueba deben coincidir con el archivo que prueban

### Estructura
- Seguir el patrón AAA (Arrange-Act-Assert)
- Agrupar pruebas por método/función usando `describe`
- Nombres de pruebas: `should [resultado esperado] when [condición]`

### Mocks
- Utilizar mocks centralizados de `src/common/mocks/`
- Utilizar `jest.mock()` para dependencias externas
- Resetear mocks en `beforeEach` con `jest.clearAllMocks()`

## Pruebas E2E

### Ubicación y Nomenclatura
- Las pruebas E2E se ubican en el directorio `/test`
- Nombres de archivos: `[feature].e2e-spec.ts`

### Estructura
- Configurar la aplicación en `beforeEach`
- Agrupar pruebas por endpoint/ruta
- Cerrar la aplicación con `afterAll`

### Datos de Prueba
- Utilizar fixtures de `/test/__fixtures__/`
- Crear factory functions para generar datos de prueba

## Convenciones de Código

### Formato de Pruebas
```typescript
// Para pruebas unitarias
describe('ClassOrMethod', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = ...;
      // Act
      const result = method(input);
      // Assert
      expect(result).toEqual(expected);
    });
  });
});

// Para pruebas E2E
describe('EndpointName (e2e)', () => {
  describe('/endpoint (METHOD)', () => {
    it('should return status code when condition', () => {
      return request(app.getHttpServer())
        .method('/endpoint')
        .send(data)
        .expect(statusCode);
    });
  });
});
```

### Cobertura de Pruebas
- Aspirar a una cobertura mínima del 80%
- Enfocarse en probar casos de éxito y error
- Probar todas las ramas lógicas importantes

## Mejores Prácticas

1. **Independencia de Pruebas**: 
   - Cada prueba debe ser independiente de las demás
   - No depender del estado modificado por otras pruebas

2. **Limpieza**:
   - Limpiar recursos en `afterEach` o `afterAll`
   - Resetear mocks en `beforeEach`

3. **Enfoque en Comportamiento**:
   - Probar comportamiento, no implementación
   - Evitar probar métodos privados directamente

4. **Aserciones Específicas**:
   - Usar aserciones específicas en lugar de genéricas
   - Proporcionar mensajes claros en las aserciones

5. **DRY en Pruebas**:
   - Extraer configuración común a funciones de ayuda
   - Utilizar `beforeEach` para configuraciones repetitivas

## Ejecución de Pruebas

### Pruebas Unitarias
```bash
# Ejecutar todas las pruebas unitarias
npm test

# Ejecutar pruebas con cobertura
npm run test:cov

# Ejecutar pruebas en modo watch
npm run test:watch
```

### Pruebas E2E
```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar pruebas E2E específicas
npm run test:e2e -- test/users.e2e-spec.ts
``` 