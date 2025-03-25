# Flujos de Usuarios en el Módulo Company Users

Este documento detalla los principales flujos de trabajo relacionados con el ciclo de vida de los usuarios de compañías en la plataforma Consentia.

## Flujo: Creación y Onboarding de Usuario

### Descripción
Proceso completo desde la creación de un usuario hasta su activación y uso del sistema.

### Participantes
- **Administrador/Manager**: Crea la cuenta de usuario
- **Sistema**: Procesa la solicitud y envía invitación
- **Nuevo Usuario**: Completa registro y accede al sistema

### Diagrama de Secuencia
```
┌─────────────┐          ┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│Administrador│          │  Sistema    │          │NotificationSvc│          │Nuevo Usuario│
└──────┬──────┘          └──────┬──────┘          └──────┬───────┘          └──────┬──────┘
       │                        │                        │                         │
       │ Crear usuario          │                        │                         │
       │─────────────────────────>                       │                         │
       │                        │                        │                         │
       │                        │ Validar datos          │                         │
       │                        │◄─────────────────────► │                         │
       │                        │                        │                         │
       │                        │ Crear en estado INACTIVE                         │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │                        │ Generar token invitación                         │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │                        │ Enviar invitación      │                         │
       │                        │───────────────────────►│                         │
       │                        │                        │                         │
       │                        │                        │ Enviar email            │
       │                        │                        │────────────────────────►│
       │                        │                        │                         │
       │ Notificar creación     │                        │                         │
       │<─────────────────────────                       │                         │
       │                        │                        │                         │
       │                        │                        │                         │ Abrir invitación
       │                        │                        │                         │────────┐
       │                        │                        │                         │        │
       │                        │                        │                         │<───────┘
       │                        │                        │                         │
       │                        │                        │                         │ Completar registro
       │                        │<──────────────────────────────────────────────────
       │                        │                        │                         │
       │                        │ Validar token          │                         │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │                        │ Activar usuario        │                         │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │                        │ Confirmar activación   │                         │
       │                        │────────────────────────────────────────────────►│
       │                        │                        │                         │
```

### Pasos Detallados

1. **Creación Inicial**
   - Administrador o Manager inicia la creación proporcionando datos básicos
   - Sistema valida formato y unicidad de email y authId
   - Sistema crea usuario en estado INACTIVE
   - Sistema genera token de invitación seguro con expiración (24 horas)
   
2. **Envío de Invitación**
   - Sistema envía email con enlace de invitación personalizado
   - El enlace contiene token seguro para validar la identidad
   - Se registra el envío de invitación en auditoría

3. **Activación y Primer Acceso**
   - Usuario recibe el email y accede al enlace
   - Sistema valida el token (no expirado, no usado, correcto)
   - Usuario completa información adicional requerida
   - Sistema actualiza usuario a estado ACTIVE
   - Sistema registra primera actividad del usuario

4. **Eventos y Notificaciones**
   - Notificación al Administrador de completitud del proceso
   - Notificación al equipo del nuevo miembro (opcional)
   - Evento de dominio `UserActivatedEvent` emitido

## Flujo: Cambio de Rol

### Descripción
Proceso para modificar el rol y por tanto los permisos de un usuario existente.

### Participantes
- **Administrador**: Solicita el cambio de rol
- **Sistema**: Valida y aplica el cambio
- **Usuario Afectado**: Recibe notificación del cambio

### Diagrama de Secuencia
```
┌─────────────┐          ┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│Administrador│          │  Sistema    │          │   Auditoría  │          │   Usuario   │
└──────┬──────┘          └──────┬──────┘          └──────┬───────┘          └──────┬──────┘
       │                        │                        │                         │
       │ Solicitar cambio rol   │                        │                         │
       │─────────────────────────>                       │                         │
       │                        │                        │                         │
       │                        │ Verificar permisos     │                         │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │                        │ Validar transición     │                         │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │                        │ Aplicar cambio         │                         │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │                        │ Registrar auditoría    │                         │
       │                        │───────────────────────►│                         │
       │                        │                        │                         │
       │                        │ Emitir evento RoleChanged                        │
       │                        │────────┐               │                         │
       │                        │        │               │                         │
       │                        │<───────┘               │                         │
       │                        │                        │                         │
       │ Confirmar cambio       │                        │                         │
       │<─────────────────────────                       │                         │
       │                        │                        │                         │
       │                        │ Notificar cambio       │                         │
       │                        │────────────────────────────────────────────────►│
       │                        │                        │                         │
```

### Pasos Detallados

1. **Solicitud de Cambio**
   - Administrador solicita cambio de rol para un usuario específico
   - Sistema verifica que el administrador tenga permisos adecuados
   - Sistema valida que la transición de rol sea permitida (ej: no puede promover a un rol superior al propio)

2. **Validación y Aplicación**
   - Sistema verifica implicaciones del cambio (acceso a recursos sensibles)
   - Sistema actualiza el rol del usuario en la base de datos
   - Se registra el cambio en el historial del usuario

3. **Notificación y Eventos**
   - Sistema registra cambio en auditoría con metadatos relevantes (quién, cuándo, rol anterior, nuevo rol)
   - Sistema emite evento de dominio `UserRoleChangedEvent`
   - Sistema notifica al usuario afectado sobre su nuevo rol y permisos
   - Opcionalmente, se notifica a otros administradores

## Flujo: Suspensión y Reactivación

### Descripción
Proceso para suspender temporalmente a un usuario y posteriormente reactivarlo.

### Participantes
- **Administrador**: Inicia suspensión o reactivación
- **Sistema**: Procesa los cambios de estado
- **Usuario Afectado**: Usuario cuyo acceso es modificado

### Diagrama de Flujo
```
                  ┌───────────────┐
                  │    ACTIVE     │
                  └───────┬───────┘
                          │
                          ▼
┌───────────┐     ┌───────────────┐
│  DELETED  │◄────┤   SUSPENDED   │
└───────────┘     └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │    ACTIVE     │
                  └───────────────┘
```

### Pasos Detallados

1. **Suspensión de Usuario**
   - Administrador solicita suspensión indicando motivo
   - Sistema verifica permisos y validez de la operación
   - Sistema cambia estado a SUSPENDED
   - Sistema revoca tokens de acceso activos
   - Sistema registra en auditoría con motivo detallado
   - Se notifica al usuario afectado

2. **Durante la Suspensión**
   - Usuario no puede acceder al sistema
   - Intentos de login son registrados pero denegados
   - Administrador puede ver usuarios suspendidos

3. **Reactivación**
   - Administrador solicita reactivación
   - Sistema verifica que las condiciones para reactivación se cumplan
   - Sistema cambia estado a ACTIVE
   - Se registra en auditoría con notas de resolución
   - Se notifica al usuario que su acceso ha sido restaurado

## Flujo: Eliminación (Soft Delete)

### Descripción
Proceso para eliminar lógicamente a un usuario del sistema.

### Participantes
- **Administrador**: Solicita la eliminación
- **Sistema**: Procesa la eliminación lógica
- **Usuario Afectado**: Es notificado de la eliminación

### Pasos Detallados

1. **Solicitud de Eliminación**
   - Administrador solicita eliminación proporcionando motivo
   - Sistema verifica permisos y validez de la operación
   - Sistema solicita confirmación debido a la naturaleza crítica

2. **Proceso de Eliminación**
   - Sistema cambia estado a DELETED
   - Sistema revoca todos los tokens de acceso
   - Sistema desvincula usuario de accesos y permisos activos
   - Sistema mantiene registros para auditoría y cumplimiento legal
   - Sistema anonimiza datos personales no esenciales

3. **Post Eliminación**
   - Usuario no puede acceder al sistema
   - Los datos siguen disponibles para reportes históricos
   - Administradores pueden ver un registro del usuario eliminado

## Flujo: Portal de Autogestión

### Descripción
Proceso mediante el cual los usuarios administran su propio perfil.

### Participantes
- **Usuario**: Gestiona su información
- **Sistema**: Procesa las actualizaciones

### Funcionalidades

1. **Gestión de Perfil**
   - Actualización de información personal
   - Gestión de preferencias de notificaciones
   - Visualización de historial de actividad

2. **Cambio de Contraseña**
   - Solicitud de cambio de contraseña
   - Verificación por email o segundo factor
   - Establecimiento de nueva contraseña

3. **Gestión de Dispositivos**
   - Visualización de sesiones activas
   - Revocación de acceso a dispositivos
   - Notificaciones de nuevos inicios de sesión

## Consideraciones Especiales

1. **Seguridad y Privacidad**
   - Todos los cambios de estado requieren auditoría
   - Cambios de rol generan notificaciones especiales
   - Se aplica validación estricta en todas las transiciones

2. **Cumplimiento y Reportes**
   - Mantener historial completo para cumplimiento legal
   - Capacidad de generar informes de actividad por usuario
   - Trazabilidad completa de cambios de permisos 