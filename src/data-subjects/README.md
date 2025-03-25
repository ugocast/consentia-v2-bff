# Módulo de Data Subjects

## Descripción

El módulo de Data Subjects (Titulares de Datos) gestiona la información relacionada con los individuos cuyos datos personales se procesan en el sistema. Implementa funcionalidades para administrar titulares, gestionar consentimientos y permitir a los usuarios ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición).

## Características Principales

- **Gestión CRUD de Titulares de Datos**: Crear, leer, actualizar y eliminar registros de titulares.
- **Portal de Autogestión**: Permite a los titulares acceder a un portal seguro para gestionar sus propios datos.
- **Historial de Consentimientos**: Seguimiento de todos los consentimientos otorgados o revocados.
- **Derechos ARCO**: Implementación completa de los derechos de Acceso, Rectificación, Cancelación y Oposición.
- **Gestión de Estados**: Control del ciclo de vida del titular (activo, inactivo, eliminado, etc.).
- **Integración con Módulos**: Conexión con módulos de auditoría, consentimientos y notificaciones.

## Estructura Técnica

El módulo sigue una arquitectura por capas con:

- **Controllers**: Exponen endpoints REST para interactuar con la API.
- **Services**: Implementan la lógica de negocio y operaciones de base de datos.
- **DTOs**: Definen las estructuras de datos para entrada y salida.
- **Interfaces**: Garantizan tipos seguros para las respuestas de la base de datos.

## Endpoints REST API

### Gestión de Titulares

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `POST` | `/data-subjects` | Crear titular | ADMIN, MANAGER |
| `GET` | `/data-subjects` | Listar titulares | ADMIN, MANAGER, AUDITOR |
| `GET` | `/data-subjects/:id` | Obtener titular por ID | ADMIN, MANAGER, AUDITOR |
| `GET` | `/data-subjects/by-email/:email` | Buscar por email | ADMIN, MANAGER, AUDITOR |
| `PATCH` | `/data-subjects/:id` | Actualizar titular | ADMIN, MANAGER |
| `DELETE` | `/data-subjects/:id` | Eliminar titular | ADMIN, MANAGER |

### Portal de Autogestión

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| `POST` | `/data-subjects/portal/request-access` | Solicitar acceso | Pública |
| `POST` | `/data-subjects/portal/verify` | Verificar token | Pública |
| `GET` | `/data-subjects/portal/:id/consent-history` | Ver historial | Token |
| `GET` | `/data-subjects/portal/:id/consent-preferences` | Ver preferencias | Token |

### Derechos ARCO

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| `POST` | `/data-subjects/portal/:id/access` | Solicitar acceso a datos | Token |
| `POST` | `/data-subjects/portal/:id/rectify` | Solicitar rectificación | Token |
| `POST` | `/data-subjects/portal/:id/delete` | Solicitar eliminación | Token |

## Estados del Titular

Los titulares pueden estar en diferentes estados representados en el enum `DataSubjectStatus`:

- `ACTIVE`: Titular activo con datos válidos
- `INACTIVE`: Titular temporalmente desactivado
- `PENDING_VERIFICATION`: Pendiente de verificar identidad
- `DELETED`: Titular marcado como eliminado (soft delete)
- `BLOCKED`: Titular bloqueado por motivos administrativos

## Mejoras Recientes

- **Manejo de Errores Avanzado**: Sistema de códigos de error estandarizados y estructurados.
- **Seguridad Mejorada**: Validación robusta de datos de entrada y protección contra inyecciones.
- **DTOs de Respuesta Estándar**: Formatos de respuesta consistentes en toda la API.
- **Documentación Swagger**: Todos los endpoints documentados con Swagger/OpenAPI.
- **Funciones de Utilidad**: Implementación de transformaciones seguras de datos.
- **Auditoría Detallada**: Registro completo de todas las operaciones críticas.

## Ejemplos de Uso

### Crear un Titular

```typescript
// POST /data-subjects
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+123456789",
  "companyId": "5f8d3a...",
  "status": "ACTIVE",
  "metadata": {
    "country": "Spain",
    "age": 30
  }
}
```

### Solicitar Acceso al Portal

```typescript
// POST /data-subjects/portal/request-access
{
  "email": "jane.doe@example.com"
}
```

## Integración con Frontend

El frontend puede integrarse con este módulo a través de:

1. **Gestión Administrativa**: Interfaz para administradores y gestores.
2. **Portal de Autogestión**: Interfaz para titulares de datos.

## Documentación Técnica

Consulta la documentación técnica detallada en:
- [Descripción Técnica](./docs/technical-overview.md)

## Próximos Pasos

- [ ] Implementación de caché para optimizar consultas frecuentes
- [ ] Ampliación de las pruebas unitarias y de integración
- [ ] Mejora del sistema de notificaciones para eventos importantes
- [ ] Implementación de métricas y analíticas 