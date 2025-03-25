# Módulo de Companies

## Descripción

El módulo de Companies (Empresas) gestiona toda la información relacionada con las organizaciones que utilizan la plataforma Consentia. Implementa funcionalidades para el registro, configuración y administración de empresas, incluyendo planes de suscripción, configuraciones personalizadas y gestión del ciclo de vida empresarial.

## Características Principales

- **Gestión CRUD de Empresas**: Crear, leer, actualizar y eliminar registros de empresas.
- **Gestión de Suscripciones**: Administración de planes y ciclos de facturación.
- **Configuraciones Personalizadas**: Ajustes de notificaciones, privacidad y marca por empresa.
- **Estados de Empresa**: Control del ciclo de vida empresarial (activa, suspendida, cancelada, etc.).
- **Auditoría de Cambios**: Registro detallado de modificaciones en datos empresariales.
- **Integración Multimodular**: Conexión con usuarios, consentimientos y titulares de datos.

## Estructura Técnica

El módulo sigue una arquitectura por capas con:

- **Controller**: Expone endpoints REST para interactuar con la API.
- **Service**: Implementa la lógica de negocio y operaciones de base de datos.
- **DTOs**: Definen las estructuras de datos para entrada y salida.
- **Enums**: Define estados y tipos de suscripción posibles.

## Endpoints REST API

### Gestión de Empresas

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `POST` | `/companies` | Crear empresa | ADMIN |
| `GET` | `/companies` | Listar empresas | ADMIN, MANAGER |
| `GET` | `/companies/:id` | Obtener empresa por ID | ADMIN, MANAGER |
| `PATCH` | `/companies/:id` | Actualizar empresa | ADMIN, MANAGER |
| `DELETE` | `/companies/:id` | Desactivar empresa | ADMIN |

### Gestión de Suscripciones

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `PATCH` | `/companies/:id/subscription` | Actualizar plan | ADMIN |
| `GET` | `/companies/:id/subscription-history` | Ver historial | ADMIN, AUDITOR |

### Configuración de Empresa

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `PATCH` | `/companies/:id/config` | Actualizar configuración | ADMIN, MANAGER |
| `GET` | `/companies/:id/config` | Obtener configuración | ADMIN, MANAGER |

## Estados de Empresa

Las empresas pueden estar en diferentes estados representados en el enum `CompanyStatus`:

- `ACTIVE`: Empresa activa con suscripción vigente
- `SUSPENDED`: Empresa temporalmente suspendida por falta de pago
- `TRIAL`: Empresa en período de prueba
- `CANCELLED`: Empresa que ha cancelado su suscripción
- `INACTIVE`: Empresa inactiva por decisión administrativa

## Planes de Suscripción

El sistema ofrece diferentes planes representados en el enum `SubscriptionPlan`:

- `FREE`: Plan básico con funcionalidades limitadas
- `STANDARD`: Plan estándar para pequeñas y medianas empresas
- `PREMIUM`: Plan completo con todas las funcionalidades

## Ejemplos de Uso

### Crear una Empresa

```typescript
// POST /companies
{
  "name": "Acme Corporation",
  "description": "Empresa dedicada a la tecnología",
  "contact_email": "contact@acme.com",
  "phone": "+123456789",
  "address": "123 Business St, Tech City",
  "subscription_plan": "STANDARD",
  "metadata": {
    "industry": "Technology",
    "size": "Medium"
  }
}
```

### Actualizar Configuración

```typescript
// PATCH /companies/{id}/config
{
  "notification_settings": {
    "email_notifications": true,
    "sms_notifications": false,
    "notification_frequency": "DAILY"
  },
  "privacy_settings": {
    "data_retention_period": 365,
    "allow_data_sharing": false,
    "require_explicit_consent": true
  }
}
```

## Integración con Frontend

El frontend puede integrarse con este módulo a través de:

1. **Panel de Administración**: Para gestión de empresas y suscripciones.
2. **Portal Empresarial**: Interfaz para administradores de cada empresa.
3. **Centro de Configuración**: Interfaz para personalizar ajustes empresariales.

## Documentación Técnica

Consulta la documentación técnica detallada en:
- [Descripción Técnica](./docs/technical-overview.md)
- [Guía de Suscripciones](./docs/subscription-guide.md)

## Próximos Pasos

- [ ] Implementación de caché para optimizar consultas frecuentes
- [ ] Sistema de notificaciones para eventos de suscripción
- [ ] Métricas y analíticas de uso por empresa
- [ ] Personalización avanzada de temas y branding 