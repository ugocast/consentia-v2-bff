# Arquitectura del Módulo Company Users

Este documento describe la arquitectura técnica detallada del módulo Company Users, sus patrones de diseño, componentes y flujos de trabajo internos.

## Estructura de Capas

El módulo sigue una arquitectura de capas con clara separación de responsabilidades:

### 1. Capa de Presentación (API)

- **Controllers**: Exponen los endpoints REST y manejan las peticiones HTTP.
- **Request DTOs**: Definen la estructura de los datos entrantes.
- **Response DTOs**: Estandarizan la estructura de las respuestas.
- **Guards**: Protegen las rutas basado en autenticación y roles.

### 2. Capa de Aplicación

- **Application Services**: Orquestan el flujo de trabajo entre diferentes componentes.
- **Command Handlers**: Procesan comandos específicos para operaciones de escritura.
- **Query Handlers**: Procesan consultas para operaciones de lectura.
- **Event Publishers**: Emiten eventos de dominio cuando ocurren cambios relevantes.

### 3. Capa de Dominio

- **Entities**: Representan objetos del dominio con comportamientos y reglas asociadas.
- **Value Objects**: Objetos inmutables que representan conceptos del dominio.
- **Domain Events**: Representan sucesos importantes en el dominio.
- **Domain Services**: Encapsulan lógica de negocio que no pertenece a una sola entidad.

### 4. Capa de Infraestructura

- **Repositories**: Implementan la persistencia de datos.
- **External Services**: Integran con servicios externos (email, autenticación).
- **Database**: Acceso a la base de datos (Supabase).
- **Caching**: Mecanismos de caché para optimizar rendimiento.

## Patrones de Diseño Implementados

### Patrones Arquitectónicos

- **Repository Pattern**: Abstrae y encapsula el acceso a datos, permitiendo:
  - Centralizar la lógica de acceso a datos
  - Facilitar pruebas unitarias mediante mocks
  - Cambiar la implementación de persistencia sin afectar la lógica de negocio

- **CQRS (Command Query Responsibility Segregation)**: Separa operaciones de lectura y escritura para:
  - Optimizar cada tipo de operación independientemente
  - Mejorar la escalabilidad y el rendimiento
  - Simplificar el código de cada operación

- **Event-Driven Architecture**: Uso de eventos para comunicación desacoplada:
  - Emisión de eventos de dominio cuando ocurren cambios importantes
  - Manejadores de eventos que reaccionan a eventos específicos
  - Permite extensibilidad sin modificar el código existente

### Patrones de Dominio

- **Entity**: Objetos con identidad única que persisten a lo largo del tiempo:
  - `CompanyUser` como entidad principal
  - Identidad basada en ID único
  - Comportamientos como cambiar estado o rol

- **Value Object**: Objetos inmutables que representan conceptos del dominio:
  - `CompanyUserRole` como enum con valores y comportamientos definidos
  - `CompanyUserStatus` como enum con estados y transiciones permitidas
  - `UserPermissions` como conjunto de permisos asociados a un rol

- **Factory**: Creación encapsulada de objetos complejos:
  - `CompanyUserFactory` para crear usuarios con valores predeterminados
  - Validación durante la creación
  - Aplicación de reglas de negocio en la instanciación

- **State Pattern**: Gestión del comportamiento basado en estados:
  - Estados del usuario (ACTIVE, INACTIVE, SUSPENDED, DELETED)
  - Transiciones controladas y validadas entre estados
  - Comportamientos específicos según el estado

## Flujo de Datos y Operaciones

### Creación de Usuario

```
┌─────────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│  Controller │────>│  AppService │────>│  UserFactory  │────>│ Repository  │
└─────────────┘     └─────────────┘     └───────────────┘     └─────────────┘
                           │                                         │
                           │                   ┌──────────────┐      │
                           └──────────────────>│EventPublisher│<─────┘
                                               └──────────────┘
```

1. El controlador recibe una petición HTTP con un `CreateCompanyUserDto`
2. El servicio de aplicación valida el DTO y permisos del solicitante
3. UserFactory crea una nueva instancia de CompanyUser
4. Repository persiste el nuevo usuario
5. EventPublisher emite un evento `UserCreatedEvent`

### Cambio de Estado

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Controller │────>│  AppService │────>│  StateManager│
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │                   ▼
                           │            ┌─────────────┐
                           │            │ Repository  │
                           │            └─────────────┘
                           │                   │
                           │                   ▼
                           │           ┌──────────────┐
                           └──────────>│EventPublisher│
                                       └──────────────┘
```

1. El controlador recibe una petición para cambiar estado con `ChangeUserStatusDto`
2. El servicio de aplicación obtiene el usuario actual y verifica permisos
3. StateManager valida la transición de estado y aplica el cambio
4. Repository actualiza el estado en la base de datos
5. EventPublisher emite un evento `UserStatusChangedEvent`

## Gestión de Estados

El módulo implementa una máquina de estados para controlar el ciclo de vida de los usuarios:

```
         ┌─────────┐
         │ INACTIVE│<───────────┐
         └────┬────┘            │
              │                  │
              ▼                  │
┌─────────┐  ┌─────────┐  ┌─────┴─────┐
│ DELETED │<─┤  ACTIVE │─>│ SUSPENDED │
└─────────┘  └─────────┘  └───────────┘
```

Las transiciones permitidas son controladas por el `StateManager`:

| Estado Actual | Estados Posibles | Condiciones |
|---------------|------------------|-------------|
| INACTIVE | ACTIVE, DELETED | Activación manual, eliminación por inactividad |
| ACTIVE | INACTIVE, SUSPENDED, DELETED | Desactivación manual, suspensión por seguridad, eliminación solicitada |
| SUSPENDED | ACTIVE, DELETED | Resolución de problemas, eliminación definitiva |
| DELETED | - | Estado terminal, no permite transiciones salientes |

## Integración con Otros Módulos

- **Auth Module**: Para autenticación y verificación de tokens
- **Companies Module**: Para validar la existencia y estado de compañías
- **Audit Module**: Para registrar todas las operaciones relevantes
- **Notification Module**: Para enviar notificaciones a usuarios

## Consideraciones de Seguridad

- **Control de Acceso**: Verificación estricta de permisos en cada operación
- **Auditoría**: Registro detallado de cada modificación con información contextual
- **Sanitización**: Limpieza de datos de entrada para prevenir inyecciones
- **Validación**: Validación exhaustiva de todos los datos de entrada
- **Protección de Datos**: Restricción en la exposición de datos sensibles

## Infraestructura y Escalabilidad

- **Caché**: Implementación de estrategias de caché para datos frecuentemente accedidos
- **Paginación**: Soporte para consultas paginadas de grandes conjuntos de datos
- **Transacciones**: Manejo de transacciones para garantizar consistencia
- **Índices**: Optimización de consultas mediante índices en campos clave 