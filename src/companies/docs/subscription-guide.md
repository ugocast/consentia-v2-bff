# Guía de Gestión de Suscripciones

Esta guía detalla la implementación y gestión del sistema de suscripciones para empresas en la plataforma Consentia.

## Planes de Suscripción

Consentia ofrece tres planes de suscripción principales:

### Plan FREE
- **Características**:
  - Hasta 100 titulares de datos
  - Hasta 3 usuarios por empresa
  - Funcionalidades básicas de gestión de consentimientos
  - Sin personalización de marca
  - Soporte por correo electrónico
- **Limitaciones**:
  - Sin acceso a reportes avanzados
  - Sin acceso a API
  - Retención de datos de 6 meses

### Plan STANDARD
- **Características**:
  - Hasta 1,000 titulares de datos
  - Hasta 10 usuarios por empresa
  - Funcionalidades completas de gestión de consentimientos
  - Personalización básica de marca
  - Soporte por correo y chat
  - Reportes básicos
  - Acceso a API con límites
- **Limitaciones**:
  - Sin integraciones avanzadas
  - Retención de datos de 12 meses

### Plan PREMIUM
- **Características**:
  - Titulares de datos ilimitados
  - Usuarios ilimitados
  - Todas las funcionalidades
  - Personalización completa de marca
  - Soporte prioritario 24/7
  - Reportes avanzados y personalizados
  - API sin restricciones
  - Integraciones con sistemas externos
  - Retención de datos configurable

## Ciclo de Facturación

El sistema maneja dos ciclos de facturación:
- **Mensual**: Facturación cada 30 días
- **Anual**: Facturación cada 365 días (con descuento)

## Gestión de Cambios de Plan

### Actualización de Plan
- De FREE a STANDARD o PREMIUM
- De STANDARD a PREMIUM

El proceso de actualización es inmediato y se aplican los nuevos límites y funcionalidades de forma automática. La facturación se ajusta proporcionalmente.

### Degradación de Plan
- De PREMIUM a STANDARD
- De STANDARD a FREE

Las degradaciones de plan se aplican al final del ciclo de facturación actual. Se notifica al administrador sobre las limitaciones que aplicarán tras el cambio.

## Periodo de Prueba (TRIAL)

Toda nueva empresa comienza con un periodo de prueba de 30 días con todas las funcionalidades del plan PREMIUM. Al finalizar este periodo, la empresa debe seleccionar un plan o será automáticamente pasada al plan FREE.

## API para Gestión de Suscripciones

### Actualizar Plan de Suscripción

```typescript
// PATCH /companies/{id}/subscription
{
  "plan": "PREMIUM",
  "billing_cycle": "ANNUAL",
  "payment_method": {
    "type": "CREDIT_CARD",
    "details": {
      // datos de pago
    }
  }
}
```

### Consultar Historial de Suscripciones

```typescript
// GET /companies/{id}/subscription-history
// Response:
{
  "subscription_history": [
    {
      "plan": "TRIAL",
      "start_date": "2023-01-01T00:00:00Z",
      "end_date": "2023-01-31T23:59:59Z"
    },
    {
      "plan": "STANDARD",
      "start_date": "2023-02-01T00:00:00Z",
      "end_date": "2023-08-01T23:59:59Z"
    },
    {
      "plan": "PREMIUM",
      "start_date": "2023-08-02T00:00:00Z",
      "end_date": null
    }
  ]
}
```

## Notificaciones

El sistema envía notificaciones automáticas en los siguientes eventos:

- **Activación de suscripción**: Al confirmar un nuevo plan
- **Renovación próxima**: 7 días antes de la renovación automática
- **Cambio de plan**: Confirmación de cambio de plan
- **Problema de facturación**: Notificación de pago rechazado
- **Suspensión inminente**: Aviso antes de suspender por falta de pago

## Funcionalidades por Plan

| Funcionalidad | FREE | STANDARD | PREMIUM |
|---------------|------|----------|---------|
| Gestión de consentimientos | Básica | Completa | Avanzada |
| Portal de titulares | Sí | Sí | Personalizable |
| Reportes | Básicos | Estándar | Avanzados |
| API | No | Limitada | Completa |
| Integraciones | No | Básicas | Avanzadas |
| Usuarios | 3 | 10 | Ilimitados |
| Titulares | 100 | 1,000 | Ilimitados |
| Soporte | Email | Email + Chat | 24/7 Prioritario |

## Consideraciones Técnicas

- **Validación de Límites**: El sistema valida los límites según el plan de suscripción antes de cada operación
- **Caché de Permisos**: Los permisos y límites se cachean para optimizar el rendimiento
- **Auditoría**: Todos los cambios de suscripción se registran con información detallada
- **Facturación**: Integración con proveedores de pago externos mediante sistema de webhooks 