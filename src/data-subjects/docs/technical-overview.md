# Módulo de Data Subjects - Documentación Técnica

## Descripción General

El módulo de Data Subjects (Titulares de Datos) es responsable de gestionar toda la información relacionada con los usuarios finales cuyos datos son procesados por el sistema. Esto incluye datos personales, consentimientos, solicitudes de derechos ARCO y la gestión del portal de autoservicio.

## Arquitectura

El módulo sigue una arquitectura por capas, conforme al patrón MVC adaptado a NestJS:

- **Controller Layer**: Maneja las solicitudes HTTP y define los endpoints
- **Service Layer**: Implementa la lógica de negocio y las operaciones de base de datos
- **DTO Layer**: Define las estructuras de datos para entrada y salida
- **Entity Layer**: Representa los objetos de la base de datos

## Estructura del Módulo

```
data-subjects/
├── dto/                   # Data Transfer Objects
│   ├── create-data-subject.dto.ts
│   ├── update-data-subject.dto.ts
│   ├── data-subject.dto.ts
│   ├── standard-response.dto.ts
│   └── ...
├── docs/                  # Documentación técnica
│   └── technical-overview.md
├── data-subjects.controller.ts  # Controlador REST
├── data-subjects.service.ts     # Servicio con lógica de negocio
├── data-subjects.module.ts      # Definición del módulo
└── README.md                   # Documentación general
```

## Patrones y Prácticas Implementadas

### 1. Error Handling Estandarizado

El módulo utiliza un sistema de manejo de errores consistente:

- Códigos de error estandarizados (`ErrorCode`) para identificar tipos de error
- Captura y registro de excepciones con contexto
- Transformación de errores de base de datos a excepciones HTTP significativas
- Retorno de respuestas de error estructuradas

Ejemplo:
```typescript
try {
  // Operación que puede fallar
} catch (error) {
  this.logger.error(`Error al procesar: ${error.message}`, error);
  throw new InternalServerErrorException({
    code: ErrorCode.DATABASE_ERROR,
    message: 'Mensaje descriptivo del error',
    originalError: error
  });
}
```

### 2. Transformación Segura de Datos

Para evitar errores en tiempo de ejecución relacionados con datos nulos o indefinidos, todas las transformaciones de datos utilizan utilidades como:

- `safeValue()`: Extrae valores con defaults
- `safeArrayMap()`: Mapeo seguro sobre arrays
- `safeMetadata()`: Garantiza que los metadatos sean objetos válidos
- `handleNestedProperty()`: Maneja propiedades anidadas de forma segura

### 3. Auditoría Consistente

Todas las operaciones críticas (crear, actualizar, eliminar) registran eventos de auditoría con metadatos detallados para trazabilidad.

### 4. DTOs de Respuesta Estandarizados

Los endpoints devuelven respuestas con estructuras consistentes:
- `DeleteResponseDto` para eliminaciones
- `ArcoRequestResponseDto` para solicitudes ARCO
- `PortalAccessResponseDto` para operaciones del portal

### 5. Documentación Swagger

Todos los endpoints están documentados con decoradores de Swagger para generar documentación automática:
- `@ApiTags` para agrupar endpoints
- `@ApiOperation` para describir operaciones
- `@ApiResponse` para documentar respuestas posibles

## Flujos de Datos Principales

### Gestión de Titulares

1. Creación/Actualización/Eliminación a través de la interfaz administrativa
2. Verificación de existencia previa para evitar duplicados
3. Validación de datos de entrada
4. Operaciones de base de datos con manejo de errores
5. Registro de auditoría
6. Respuesta estandarizada

### Portal de Autogestión

1. Solicitud de acceso con email
2. Verificación de existencia del titular
3. Generación de token temporal (24h)
4. Verificación del token para acceso
5. Gestión de preferencias de consentimiento
6. Solicitudes de derechos ARCO

### Derechos ARCO

Los titulares pueden ejercer sus derechos ARCO mediante endpoints específicos:
- Acceso: /portal/:id/access
- Rectificación: /portal/:id/rectify
- Cancelación: /portal/:id/delete
- Oposición: Implementada a través del sistema de consentimientos

## Consideraciones de Rendimiento

- Queries optimizadas a Supabase
- Manejo eficiente de conexiones
- Transformación de datos optimizada
- Logging estructurado y nivelado

## Integración con Otros Módulos

- **Common**: Utilidades, filtros y servicios compartidos
- **Auth**: Autenticación y autorización
- **Consents**: Gestión de consentimientos
- **Audit**: Registro de eventos de auditoría
- **Notifications**: Envío de correos y notificaciones

## Pruebas

El módulo incluye pruebas unitarias y de integración con cobertura para:
- Validación de DTOs
- Lógica de negocio en servicios
- Endpoints de API
- Manejo de errores

## Mejoras Futuras

1. Implementación de caché para optimizar consultas frecuentes
2. Sistema de notificaciones para eventos importantes
3. Flujos de trabajo para aprobación de solicitudes ARCO
4. Métricas y dashboards para análisis de uso 