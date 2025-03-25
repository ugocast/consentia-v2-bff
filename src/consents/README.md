# Módulo de Consentimientos

## Descripción

El módulo de Consentimientos gestiona todo el ciclo de vida de los consentimientos en la plataforma Consentia. Desde la creación de solicitudes, pasando por la obtención de la respuesta del titular de datos, hasta el mantenimiento del registro de consentimientos activos, revocados o expirados.

## Características Principales

- **Gestión Integral de Consentimientos**: Creación, consulta, actualización y revocación.
- **Sistema de Solicitudes**: Flujo completo para solicitar y obtener respuestas de consentimiento.
- **Estados de Consentimiento**: Manejo de diferentes estados (aprobado, rechazado, revocado, expirado).
- **Auditoría Detallada**: Registro de todas las acciones realizadas sobre consentimientos.
- **Metadatos Flexibles**: Soporte para información contextual como IP, dispositivo y ubicación.
- **Verificación de Validez**: Comprobación de vigencia y validez de consentimientos.

## Estructura Técnica

El módulo está organizado con una arquitectura por capas:

- **Controller**: Define los endpoints REST y gestiona las peticiones HTTP.
- **Service**: Implementa la lógica de negocio y las operaciones con la base de datos.
- **DTOs**: Definen las estructuras de datos para la entrada y salida de información.
- **Documentación**: Incluye documentación técnica y guías de uso.

## Endpoints REST API

### Gestión de Consentimientos

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| `GET` | `/consents` | Listar consentimientos | JWT |
| `GET` | `/consents/:id` | Obtener consentimiento detallado | JWT |
| `PATCH` | `/consents/:id/status` | Actualizar estado | JWT |

### Solicitudes de Consentimiento

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| `POST` | `/consents/requests` | Crear solicitud | JWT + Roles |
| `GET` | `/consents/requests/:id` | Obtener solicitud | Público |
| `POST` | `/consents/requests/:id/respond` | Responder a solicitud | Público |

## Estados de Consentimiento

Los consentimientos tienen diferentes estados representados en el enum `ConsentStatus`:

- `APPROVED`: Consentimiento aprobado y vigente
- `REJECTED`: Consentimiento rechazado explícitamente
- `REVOKED`: Consentimiento previamente aprobado y luego revocado
- `EXPIRED`: Consentimiento que ha superado su fecha de validez
- `PENDING`: Solicitud pendiente de respuesta

## Flujo de Trabajo

### Solicitud de Consentimiento

1. Un administrador crea una solicitud para un titular específico
2. El sistema genera un enlace único para responder
3. El enlace se envía al titular (vía email, SMS, etc.)
4. El titular accede al enlace para aprobar o rechazar

### Gestión de Estado

Los consentimientos pueden cambiar de estado según ciertas reglas:
- De `APPROVED` a `REVOKED` (revocación)
- De `APPROVED` a `EXPIRED` (expiración automática)
- De `PENDING` a `APPROVED` o `REJECTED` (respuesta del titular)

## Ejemplos de Uso

### Crear una Solicitud de Consentimiento

```typescript
// POST /consents/requests
{
  "dataSubjectId": "123e4567-e89b-12d3-a456-426614174000",
  "legalPolicyId": "098f6bcd-4621-3373-8ade-4e832627b4f6",
  "isMandatory": false,
  "expiryDate": "2023-12-31T23:59:59Z",
  "metadata": {
    "purpose": "Marketing emails"
  }
}
```

### Responder a una Solicitud

```typescript
// POST /consents/requests/{id}/respond
{
  "decision": "APPROVED",
  "reason": "Acepto recibir comunicaciones de marketing",
  "metadata": {
    "customField": "Valor adicional"
  }
}
```

## Integración con Frontend

El frontend puede integrarse con este módulo a través de:

1. **Panel de Administración**: Para crear y gestionar solicitudes de consentimiento.
2. **Widget de Consentimiento**: Componente embebible para sitios web.
3. **Centro de Preferencias**: Interfaz para que los titulares gestionen sus consentimientos.

## Documentación Técnica

Consulta la documentación técnica detallada en:
- [Descripción Técnica](./docs/technical-overview.md)

## Mejoras Recientes

- **Respuestas Estandarizadas**: DTOs específicos para cada tipo de respuesta.
- **Documentación Swagger**: Endpoints completamente documentados con Swagger/OpenAPI.
- **Validación Mejorada**: Sistema robusto de validación de datos de entrada.
- **Auditoría Detallada**: Registro completo de todas las operaciones.

## Próximos Pasos

- [ ] Implementación de caché para mejorar rendimiento
- [ ] Sistema avanzado de notificaciones para nuevas solicitudes
- [ ] Plantillas personalizables para solicitudes de consentimiento
- [ ] Mejoras en reportes y analíticas de consentimientos 