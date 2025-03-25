# Módulo de Consentimientos - Documentación Técnica

## Descripción General

El módulo de Consentimientos es el componente central de la plataforma Consentia, responsable de gestionar el ciclo completo de los consentimientos: desde la solicitud, pasando por la respuesta del titular de datos, hasta el mantenimiento del registro de consentimientos activos y su historial.

## Arquitectura

El módulo sigue una arquitectura por capas adaptada al framework NestJS:

- **Controller Layer**: Define endpoints REST y gestiona las peticiones HTTP
- **Service Layer**: Implementa la lógica de negocio y operaciones con base de datos
- **DTO Layer**: Define estructuras de datos para entrada y salida
- **Entity Layer**: Representación de objetos de base de datos

## Estructura del Módulo

```
consents/
├── dto/                   # Data Transfer Objects
│   ├── consent.dto.ts
│   ├── consent-status.enum.ts
│   ├── consent-request.dto.ts
│   ├── create-consent-request.dto.ts
│   ├── respond-consent-request.dto.ts
│   ├── standard-response.dto.ts
│   └── ...
├── docs/                  # Documentación técnica
│   └── technical-overview.md
├── consents.controller.ts # Controlador REST
├── consents.service.ts    # Servicio con lógica de negocio
├── consents.module.ts     # Definición del módulo
└── README.md             # Documentación general
```

## Patrones y Prácticas Implementadas

### 1. Flujo de Consentimientos Estructurado

El módulo implementa un flujo completo para la gestión de consentimientos:

1. **Solicitud de Consentimiento**: Creada por administradores o sistemas para obtener consentimiento de un titular.
2. **Respuesta a Solicitud**: El titular responde a la solicitud (aprobación o rechazo).
3. **Gestión de Estado**: Los consentimientos pasan por diferentes estados durante su ciclo de vida.
4. **Revocación**: Los consentimientos pueden ser revocados en cualquier momento.

### 2. Estados de Consentimiento

Los consentimientos tienen estados bien definidos en el enum `ConsentStatus`:

- `APPROVED`: Consentimiento otorgado
- `REJECTED`: Consentimiento rechazado explícitamente
- `REVOKED`: Consentimiento previamente otorgado y luego revocado
- `EXPIRED`: Consentimiento que ha superado su fecha de validez
- `PENDING`: Solicitud de consentimiento pendiente de respuesta

### 3. Respuestas Estandarizadas

Todos los endpoints utilizan DTOs de respuesta estandarizados:

- `ConsentResponseDto`: Respuestas generales
- `ConsentStatusResponseDto`: Actualizaciones de estado
- `ConsentRequestResponseDto`: Solicitudes de consentimiento
- `ConsentRequestAnswerResponseDto`: Respuestas a solicitudes

### 4. Documentación Swagger

Los endpoints están completamente documentados usando decoradores de Swagger:

- `@ApiTags` para agrupar endpoints
- `@ApiOperation` para describir operaciones
- `@ApiResponse` para documentar respuestas
- `@ApiParam` y `@ApiQuery` para parámetros

### 5. Integración con Auditoría

Todas las operaciones críticas registran eventos de auditoría:

- Creación de solicitudes
- Cambios de estado
- Respuestas a solicitudes
- Revocaciones

### 6. Manejo de Metadatos Flexible

El módulo soporta metadatos flexibles para diferentes casos de uso:

- Información del dispositivo y navegador
- Geolocalización opcional
- Datos adicionales específicos del caso de uso

## Flujos Principales

### Solicitud de Consentimiento

1. El administrador crea una solicitud de consentimiento para un titular específico
2. El sistema registra la solicitud con estado `PENDING`
3. Se genera un enlace único para responder a la solicitud
4. El enlace se envía al titular (por email, SMS, etc.)

### Respuesta a Solicitud

1. El titular accede al enlace de respuesta
2. La solicitud se valida (existencia, vigencia)
3. El titular decide aprobar o rechazar
4. Se registra el consentimiento con el estado correspondiente
5. Se registra información contextual (IP, user-agent, timestamp)

### Actualización de Estado

1. Un administrador o sistema solicita cambiar el estado
2. Se verifica si la transición de estado es válida
3. Se actualiza el estado y se registra la auditoría
4. Se devuelve el estado anterior y el nuevo

## Consideraciones de Seguridad

- Validación de tokens para acceso a solicitudes
- Registro de IP y user-agent para trazabilidad
- Permisos y roles para operaciones administrativas
- Validación de datos de entrada

## Integración con Otros Módulos

- **Data Subjects**: Para verificar titulares al crear solicitudes
- **Legal Policies**: Para asociar políticas legales a consentimientos
- **Audit**: Para registrar acciones sobre consentimientos
- **Notification**: Para enviar solicitudes a titulares

## Rendimiento y Escalabilidad

- Consultas optimizadas para alta carga
- Paginación para resultados extensos
- Índices en las columnas críticas de búsqueda

## Mejoras Futuras

1. Implementación de caché para consultas frecuentes
2. Notificaciones en tiempo real para nuevas solicitudes
3. Mejora en la UI/UX del flujo de consentimiento
4. Soporte para plantillas personalizables de solicitud
5. Integración con sistemas externos vía webhooks 