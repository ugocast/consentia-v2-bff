# Módulo de Políticas Legales - Documentación Técnica

## Descripción General

El módulo de Políticas Legales (Legal Policies) gestiona todo lo relacionado con las políticas y términos legales que rigen el uso de datos personales dentro de la plataforma Consentia. Este módulo es crítico para el cumplimiento normativo ya que proporciona la base legal para la recolección y tratamiento de datos personales.

## Arquitectura

El módulo sigue una arquitectura por capas adaptada al framework NestJS:

- **Controller Layer**: Define endpoints REST y gestiona las peticiones HTTP
- **Service Layer**: Implementa la lógica de negocio y operaciones con base de datos
- **DTO Layer**: Define estructuras de datos para entrada y salida
- **Entity Layer**: Representación de objetos de base de datos

## Estructura del Módulo

```
policies/
├── dto/                   # Data Transfer Objects
│   ├── create-policy.dto.ts
│   ├── update-policy.dto.ts
│   ├── policy.dto.ts
│   ├── policy-status.enum.ts
│   ├── standard-response.dto.ts
│   └── index.ts
├── docs/                  # Documentación técnica
│   └── technical-overview.md
├── policies.controller.ts # Controlador REST
├── policies.service.ts    # Servicio con lógica de negocio
├── policies.module.ts     # Definición del módulo
└── README.md             # Documentación general
```

## Patrones y Prácticas Implementadas

### 1. Versionado de Políticas

El módulo implementa un sistema de versionado de políticas que permite:

- Mantener un historial completo de cambios en las políticas
- Garantizar que los consentimientos estén asociados a versiones específicas
- Conservar versiones anteriores para auditoría y cumplimiento legal
- Transiciones controladas entre versiones

### 2. Estados de Política

Las políticas pueden pasar por diferentes estados definidos en `PolicyStatus`:

- `DRAFT`: Política en borrador, aún no publicada
- `ACTIVE`: Política activa y en uso
- `INACTIVE`: Política que ha sido temporalmente desactivada
- `ARCHIVED`: Política histórica que ya no está en uso
- `DELETED`: Política marcada como eliminada (soft delete)

Las transiciones entre estados están estrictamente controladas mediante el método `isValidStatusTransition()` que define las transiciones permitidas.

### 3. Respuestas Estandarizadas

Todos los endpoints utilizan DTOs de respuesta estandarizados:

- `PolicyResponseDto`: Respuestas generales
- `PolicyCreateResponseDto`: Creación de políticas
- `PolicyVersionResponseDto`: Versiones de políticas
- `PolicyStatusResponseDto`: Cambios de estado
- `PolicyDeleteResponseDto`: Eliminación de políticas

### 4. Documentación Swagger

Los endpoints están completamente documentados usando decoradores de Swagger:

- `@ApiTags` para agrupar endpoints
- `@ApiOperation` para describir operaciones
- `@ApiResponse` para documentar respuestas
- `@ApiParam` y `@ApiQuery` para parámetros

### 5. Integración con Auditoría

Todas las operaciones críticas registran eventos de auditoría:

- Creación de políticas
- Actualizaciones (nuevas versiones)
- Cambios de estado
- Eliminaciones

### 6. Validación y Seguridad

- Validación de datos de entrada mediante DTOs
- Control de acceso basado en roles (RBAC)
- Protección de endpoints con guardias de autenticación
- Validación de transiciones de estado

## Flujos Principales

### Creación de Política

1. Usuario con rol administrador o gestor crea una política
2. El sistema registra la política con estado `DRAFT`
3. Se genera un ID único para la política
4. Se registra un evento de auditoría

### Actualización de Política (Versionado)

1. Para actualizar una política existente, se crea una nueva versión
2. La versión anterior queda marcada con una fecha de validez hasta (`valid_to`)
3. La nueva versión apunta a la anterior mediante `previous_version_id`
4. Se mantiene la referencia al ID de compañía y otros metadatos
5. Se registra un evento de auditoría con enlaces a ambas versiones

### Cambio de Estado

1. Se verifica si la transición es válida según las reglas definidas
2. Se actualiza el estado de la política
3. Se registra un evento de auditoría con el estado anterior y nuevo
4. Se devuelve una respuesta con información detallada del cambio

### Eliminación (Soft Delete)

1. La política se marca con estado `DELETED`
2. No se elimina físicamente de la base de datos
3. Se registra un evento de auditoría
4. La política ya no aparece en listados estándar

## Consideraciones de Rendimiento

- Queries optimizadas para cargar solo las políticas activas por defecto
- Endpoint específico para consultar versiones históricas
- Índices en columnas críticas para búsqueda (id, company_id, status)

## Integración con Otros Módulos

- **Consentimientos**: Para asociar consentimientos a políticas específicas
- **Auditoría**: Para registrar cambios en políticas
- **Compañías**: Para gestionar políticas por compañía
- **Tipos de Datos**: Para asociar tipos de datos a políticas legales

## Mejoras Futuras

1. Soporte para múltiples idiomas en las políticas
2. Sistema de aprobación para cambios en políticas
3. Comparación visual entre versiones
4. Plantillas predefinidas para tipos comunes de políticas
5. Análisis automático de contenido para detectar posibles problemas de cumplimiento 