# Guía de Implementación del Backend for Frontend (BFF) para Consentia

## Introducción

Este documento detalla la arquitectura e implementación del Backend for Frontend (BFF) para el sistema Consentia. El BFF actúa como una capa intermedia entre el frontend de Next.js y Supabase, proporcionando una abstracción que simplifica la lógica del cliente, mejora la seguridad y optimiza el rendimiento. Está desarrollado con NestJS, un framework de Node.js para aplicaciones del lado del servidor.

## Arquitectura General

### Estructura de Directorios

```
src/
├── app.controller.ts    # Controlador principal
├── app.module.ts        # Módulo principal
├── app.service.ts       # Servicio principal
├── auth/                # Módulo de autenticación
│   ├── auth.controller.ts  # Controlador de autenticación
│   ├── auth.module.ts      # Módulo de autenticación
│   ├── auth.service.ts     # Servicio de autenticación
│   ├── dto/                # DTOs para autenticación
│   └── jwt/                # Guard JWT
├── config/              # Configuraciones
│   └── supabase.config.ts # Configuración de Supabase
├── users/               # Módulo de usuarios
│   ├── users.controller.ts # Controlador de usuarios
│   ├── users.module.ts     # Módulo de usuarios
│   ├── users.service.ts    # Servicio de usuarios
│   ├── dto/                # DTOs para usuarios
│   └── decorators/         # Decoradores personalizados
├── companies/           # Módulo de empresas
│   ├── companies.controller.ts
│   ├── companies.module.ts
│   ├── companies.service.ts
│   └── dto/
├── data-types/         # Módulo de tipos de datos
│   ├── data-types.controller.ts
│   ├── data-types.module.ts
│   ├── data-types.service.ts
│   └── dto/
├── bulk-operations/    # Módulo de operaciones masivas
│   ├── bulk-operations.controller.ts
│   ├── bulk-operations.module.ts
│   ├── bulk-operations.service.ts
│   └── dto/
├── policies/           # Módulo de políticas legales
│   ├── policies.controller.ts
│   ├── policies.module.ts
│   ├── policies.service.ts
│   └── dto/
├── consents/           # Módulo de consentimientos
│   ├── consents.controller.ts
│   ├── consents.module.ts
│   ├── consents.service.ts
│   └── dto/
├── reports/            # Módulo de reportes
│   ├── reports.controller.ts
│   ├── reports.module.ts
│   ├── reports.service.ts
│   └── dto/
├── common/             # Utilidades y configuraciones comunes
│   ├── decorators/     # Decoradores personalizados
│   ├── filters/        # Filtros de excepción
│   ├── guards/         # Guardias de autenticación
│   ├── interceptors/   # Interceptores
│   └── pipes/          # Pipes de validación
└── main.ts             # Punto de entrada de la aplicación
```

### Tecnologías Principales

- **NestJS**: Framework de Node.js para aplicaciones del lado del servidor
- **TypeScript**: Lenguaje de programación con tipado estático
- **Supabase**: Plataforma de backend como servicio (BaaS) utilizada para autenticación y almacenamiento de datos
- **class-validator**: Biblioteca para validación de datos basada en decoradores
- **Jest**: Framework de pruebas

### Principios de Diseño

1. **Separación de Responsabilidades**: Cada módulo y controlador tiene una responsabilidad única y bien definida.
2. **Orientación al Dominio**: Los módulos se organizan según los dominios de la aplicación.
3. **Validación Centralizada**: Todas las entradas se validan antes de procesarse usando DTOs y class-validator.
4. **Transformación de Datos**: El BFF adapta los datos de Supabase al formato esperado por el frontend.
5. **Seguridad por Diseño**: Implementación de guardias JWT y estrategias de autenticación en cada endpoint.
6. **Trazabilidad**: Registro de acciones importantes para auditoría.

## Mapeo de Endpoints a Componentes Frontend

### 1. Módulo de Empresas ✅

#### Endpoints Implementados:

| Endpoint | Método | Descripción | Tablas Involucradas |
|----------|--------|-------------|---------------------|
| `/api/v1/companies/:id/config` | GET | Obtener configuración de empresa | `company`, `companyConfiguration` |
| `/api/v1/companies/:id/config` | PUT | Actualizar configuración | `company`, `companyConfiguration` |
| `/api/v1/companies/:id/subscription` | GET | Obtener plan de suscripción | `company` |
| `/api/v1/companies/:id/subscription` | PUT | Actualizar plan de suscripción | `company` |

#### Componentes Frontend Relacionados:

- `CompanyProfileForm`: Gestión de configuración de empresa
- `NotificationSettings`: Configuración de notificaciones
- `SubscriptionManager`: Gestión de planes de suscripción
- `BillingInformation`: Información de facturación

### 2. Módulo de Tipos de Datos ✅

#### Endpoints Implementados:

| Endpoint | Método | Descripción | Tablas Involucradas |
|----------|--------|-------------|---------------------|
| `/api/v1/companies/:companyId/data-types` | GET | Listar tipos de datos | `dataType` |
| `/api/v1/companies/:companyId/data-types` | POST | Crear tipo de datos | `dataType` |
| `/api/v1/companies/:companyId/data-types/:id` | GET | Obtener tipo de datos | `dataType` |
| `/api/v1/companies/:companyId/data-types/:id` | PUT | Actualizar tipo de datos | `dataType` |
| `/api/v1/companies/:companyId/data-types/:id` | DELETE | Eliminar tipo de datos | `dataType` |

#### Componentes Frontend Relacionados:

- `DataTypeSelector`: Selección de tipos de datos
- `DataTypeForm`: Creación/edición de tipos de datos
- `DataTypeList`: Lista de tipos de datos

### 3. Módulo de Operaciones Masivas ✅

#### Endpoints Implementados:

| Endpoint | Método | Descripción | Tablas Involucradas |
|----------|--------|-------------|---------------------|
| `/api/v1/consents/bulk` | POST | Crear operación masiva | `bulkOperation` |
| `/api/v1/consents/bulk/:id` | GET | Obtener estado de operación | `bulkOperation` |
| `/api/v1/consents/bulk/:id` | DELETE | Cancelar operación | `bulkOperation` |

#### Componentes Frontend Relacionados:

- `BulkActionPanel`: Panel de operaciones masivas
- `BulkOperationStatus`: Estado de operaciones
- `BulkOperationList`: Lista de operaciones

### 4. Módulo de Autenticación

#### Endpoints:

| Endpoint | Método | Descripción | Tablas Involucradas |
|----------|--------|-------------|---------------------|
| `/api/v1/auth/register` | POST | Registro de usuarios | `auth_users`, `company`, `company_user` |
| `/api/v1/auth/login` | POST | Inicio de sesión | `auth_users`, `company_user` |
| `/api/v1/auth/logout` | POST | Cierre de sesión | `auth_users` |
| `/api/v1/auth/reset-password` | POST | Solicitar restablecimiento | `auth_users` |
| `/api/v1/auth/update-password` | POST | Actualizar contraseña | `auth_users` |
| `/api/v1/auth/refresh-token` | POST | Refrescar token JWT | `auth_users` |

#### Componentes Frontend Relacionados:

- `LoginForm`: Formulario de inicio de sesión
- `RegisterForm`: Formulario de registro
- `ResetPasswordForm`: Formulario de restablecimiento
- `AuthProvider`: Proveedor de autenticación

### 5. Módulo de Usuarios

#### Endpoints:

| Endpoint | Método | Descripción | Tablas Involucradas |
|----------|--------|-------------|---------------------|
| `/api/v1/users/me` | GET | Obtener perfil | `auth_users`, `company_user` |
| `/api/v1/users/me` | PATCH | Actualizar perfil | `auth_users`, `company_user` |
| `/api/v1/users/me` | DELETE | Eliminar cuenta | `auth_users`, `company_user` |

#### Componentes Frontend Relacionados:

- `UserProfile`: Perfil de usuario
- `ProfileEditor`: Editor de perfil
- `AccountDeletion`: Eliminación de cuenta

## Mejores Prácticas para la Implementación

### 1. Seguridad

#### Autenticación y Autorización

- Utilizar guardias JWT para proteger rutas que requieren autenticación
- Implementar roles y permisos para endpoints administrativos
- Aprovechar las políticas Row Level Security de Supabase como capa adicional de seguridad

#### Protección de Datos

- Utilizar DTOs y class-validator para validar todas las entradas
- Asegurar que no se filtren datos sensibles al frontend
- Encriptar datos sensibles en tránsito y en reposo

### 2. Rendimiento

#### Optimización de Consultas

- Solicitar solo los campos necesarios en las consultas a Supabase
- Utilizar la sintaxis de consulta anidada para reducir el número de peticiones
- Implementar paginación para conjuntos de datos grandes

#### Caché

- Utilizar interceptores de caché de NestJS para datos que cambian con poca frecuencia
- Definir estrategias de invalidación de caché
- Separar la caché por usuario para datos personalizados

### 3. Estructura y Organización

#### Modularidad

- Seguir la estructura modular de NestJS
- Extraer lógica común a servicios reutilizables
- Utilizar middleware y guardias para funcionalidades transversales

#### Manejo de Errores

- Utilizar filtros de excepción de NestJS para un manejo consistente
- Registrar errores con suficiente contexto para depuración
- Proporcionar mensajes de error claros y accionables

### 4. Trazabilidad y Auditoría

#### Logging

- Utilizar el sistema de logging integrado de NestJS
- Definir niveles de log apropiados (info, warn, error)
- Incluir información contextual en los logs

#### Auditoría

- Registrar todas las acciones importantes en `audit_log`
- Incluir metadatos relevantes como dirección IP y detalles de la acción
- Asegurar que las acciones registradas no puedan ser repudiadas

## Configuración

El proyecto utiliza variables de entorno para la configuración:

### Supabase
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Servidor
```
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## Próximos Pasos

### Características Pendientes de Alta Prioridad

1. **Gestión Avanzada de Usuarios**
   - Implementar roles específicos (ADMINISTRATOR, OPERATOR, AUDITOR)
   - Sistema de invitaciones a empresas

2. **Soporte Multi-Canal**
   - Configuración de canales (EMAIL, SMS, PORTAL, API)
   - Gestión de consentimientos por canal

3. **Relación Consentimientos-Tipos de Datos**
   - Gestión de tipos de datos por consentimiento
   - Validación de tipos de datos

### Mejoras de Seguridad Pendientes

1. Rate limiting
2. Validación de IP/geolocalización
3. Encriptación de datos sensibles
4. Validación de permisos específicos por operación
5. Manejo de roles intermedios (MANAGER, AUDITOR)
6. Validación de estado de cuenta de usuario

## Conclusión

La implementación actual del BFF para Consentia proporciona una base sólida con las características core implementadas, incluyendo gestión de empresas, tipos de datos y operaciones masivas. La arquitectura modular y las mejores prácticas implementadas facilitan el mantenimiento y la escalabilidad del sistema.

Las próximas fases de desarrollo deben enfocarse en completar las características de alta prioridad pendientes, especialmente en el área de gestión de usuarios y soporte multi-canal. Este desarrollo debe realizarse de manera incremental, siguiendo las prioridades recomendadas, para entregar valor de manera continua al proyecto. 