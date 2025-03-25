# Módulo de Políticas Legales

## Descripción

El módulo de Políticas Legales (Legal Policies) gestiona la creación, actualización y seguimiento de las políticas y términos legales en la plataforma Consentia. Estas políticas sirven como base legal para el consentimiento informado y el tratamiento de datos personales, siendo fundamentales para el cumplimiento normativo de leyes como GDPR, LGPD y otras regulaciones de privacidad.

## Características Principales

- **Versionado Completo**: Sistema de versionado que mantiene historial de cambios y garantiza integridad legal.
- **Gestión de Estados**: Control de ciclo de vida de políticas (borrador, activo, inactivo, archivado, eliminado).
- **Multi-compañía**: Soporte para gestionar políticas por compañía/organización.
- **Auditoría Detallada**: Registro completo de cambios para cumplimiento y trazabilidad.
- **Metadatos Flexibles**: Soporte para información adicional como categorías, etiquetas y referencias legales.
- **Seguridad por Roles**: Control de acceso basado en roles para operaciones críticas.

## Estructura Técnica

El módulo está organizado con una arquitectura por capas:

- **Controller**: Define los endpoints REST y gestiona las peticiones HTTP.
- **Service**: Implementa la lógica de negocio y las operaciones con la base de datos.
- **DTOs**: Definen las estructuras de datos para la entrada y salida de información.
- **Documentación**: Incluye documentación técnica y guías de uso.

## Endpoints REST API

### Gestión de Políticas

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/policies` | Listar políticas activas | Todos |
| `GET` | `/policies/:id` | Obtener política por ID | Todos |
| `POST` | `/policies` | Crear nueva política | ADMIN, MANAGER |
| `PUT` | `/policies/:id` | Actualizar política (nueva versión) | ADMIN, MANAGER |
| `PUT` | `/policies/:id/status` | Cambiar estado de política | ADMIN, MANAGER |
| `DELETE` | `/policies/:id` | Eliminar política (soft delete) | ADMIN, MANAGER |
| `GET` | `/policies/:id/versions` | Obtener historial de versiones | Todos |

## Estados de Políticas

Las políticas pasan por diferentes estados durante su ciclo de vida:

- `DRAFT`: Política en etapa de creación, no publicada
- `ACTIVE`: Política activa y en vigor
- `INACTIVE`: Política temporalmente desactivada
- `ARCHIVED`: Política histórica que ya no está en uso
- `DELETED`: Política marcada como eliminada

## Flujo de Trabajo

### Creación y Publicación

1. Un administrador crea una nueva política en estado `DRAFT`
2. El equipo legal revisa y ajusta el contenido según sea necesario
3. Una vez aprobada, se cambia el estado a `ACTIVE` para publicarla
4. La política está disponible para asociarse a consentimientos

### Actualización y Versionado

1. Para modificar una política existente, se crea una nueva versión
2. La versión anterior se marca automáticamente con fecha de finalización
3. La nueva versión se vincula a la anterior mediante referencia
4. Los consentimientos existentes mantienen su asociación con la versión original
5. Los nuevos consentimientos se asocian a la versión más reciente

## Ejemplos de Uso

### Crear una Política

```typescript
// POST /policies
{
  "title": "Política de Privacidad",
  "content": "Esta política de privacidad describe cómo recopilamos...",
  "companyId": "123e4567-e89b-12d3-a456-426614174000",
  "dataTypes": ["email", "name", "address", "phone"]
}
```

### Actualizar una Política (Crear Nueva Versión)

```typescript
// PUT /policies/{id}
{
  "title": "Política de Privacidad (Actualizada)",
  "content": "Versión actualizada de la política de privacidad...",
  "dataTypes": ["email", "name", "address", "phone", "location"]
}
```

### Cambiar Estado de una Política

```typescript
// PUT /policies/{id}/status
{
  "status": "ACTIVE"
}
```

## Integración con Frontend

El frontend puede integrarse con este módulo a través de:

1. **Gestor de Políticas**: Interfaz para administradores y gestores.
2. **Visualizador de Políticas**: Componente para mostrar políticas a usuarios finales.
3. **Selector de Versiones**: Interfaz para consultar versiones históricas.

## Documentación Técnica

Consulta la documentación técnica detallada en:
- [Descripción Técnica](./docs/technical-overview.md)

## Mejoras Recientes

- **Respuestas Estandarizadas**: DTOs específicos para cada tipo de respuesta.
- **Documentación Swagger**: Endpoints completamente documentados con Swagger/OpenAPI.
- **Validación de Transiciones**: Sistema robusto para control de cambios de estado.
- **Auditoría Mejorada**: Registro detallado de cambios y acciones.

## Próximos Pasos

- [ ] Implementación de soporte para múltiples idiomas
- [ ] Sistema de aprobación para cambios en políticas
- [ ] Plantillas predefinidas para tipos comunes de políticas
- [ ] Comparador visual de versiones de políticas 