# Módulo de Company Users

## Descripción

El módulo de Company Users (Usuarios de Empresa) gestiona todos los aspectos relacionados con los usuarios que pertenecen a las diferentes compañías registradas en la plataforma Consentia. Implementa funcionalidades para la administración de usuarios, asignación de roles, control de permisos y seguimiento de actividades, garantizando la correcta segregación de responsabilidades dentro de cada organización.

## Características Principales

- **Gestión CRUD de Usuarios**: Crear, leer, actualizar y eliminar usuarios asociados a compañías.
- **Sistema de Roles y Permisos**: Administración de diferentes niveles de acceso (ADMIN, MANAGER, OPERATOR, VIEWER).
- **Gestión de Estados**: Control del ciclo de vida de los usuarios (activo, inactivo, suspendido, eliminado).
- **Auditoría Detallada**: Registro completo de todas las operaciones realizadas por y sobre usuarios.
- **Portal de Autogestión**: Interfaz para que los usuarios administren su propio perfil y preferencias.
- **Integración con IAM**: Conexión con proveedores de identidad para autenticación segura.

## Estructura Técnica

El módulo sigue una arquitectura por capas con:

- **Controllers**: Exponen endpoints REST para interactuar con la API.
- **Services**: Implementan la lógica de negocio y operaciones de dominio.
- **Repositories**: Abstraen el acceso a datos y operaciones de persistencia.
- **Domain Models**: Representan entidades y agregados del modelo de dominio.
- **DTOs**: Definen las estructuras de datos para entrada y salida.

## Endpoints REST API

### Gestión de Usuarios

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `POST` | `/company-users?companyId=X` | Crear usuario | ADMIN |
| `GET` | `/company-users?companyId=X` | Listar usuarios | ADMIN, MANAGER |
| `GET` | `/company-users/:id?companyId=X` | Obtener usuario por ID | ADMIN, MANAGER |
| `PUT` | `/company-users/:id?companyId=X` | Actualizar usuario | ADMIN, MANAGER |
| `DELETE` | `/company-users/:id?companyId=X` | Eliminar usuario | ADMIN |

### Portal de Autogestión

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| `GET` | `/company-users/me` | Obtener perfil propio | JWT |
| `PUT` | `/company-users/me` | Actualizar perfil propio | JWT |
| `PUT` | `/company-users/me/password` | Cambiar contraseña | JWT |
| `GET` | `/company-users/me/activity` | Ver historial de actividad | JWT |

### Gestión de Roles y Permisos

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `PUT` | `/company-users/:id/role?companyId=X` | Cambiar rol de usuario | ADMIN |
| `GET` | `/company-users/roles` | Listar roles disponibles | ADMIN, MANAGER |
| `GET` | `/company-users/permissions` | Listar permisos por rol | ADMIN, MANAGER |

## Estados del Usuario

Los usuarios pueden estar en diferentes estados representados en el enum `CompanyUserStatus`:

- `ACTIVE`: Usuario activo con acceso completo según su rol
- `INACTIVE`: Usuario temporalmente desactivado
- `SUSPENDED`: Usuario suspendido por motivos de seguridad o administrativos
- `DELETED`: Usuario marcado como eliminado (soft delete)

## Roles de Usuario

El sistema define varios roles con diferentes niveles de permisos:

- `ADMIN`: Acceso completo a todas las funcionalidades de la compañía
- `MANAGER`: Gestión de operaciones diarias pero sin cambios estructurales
- `OPERATOR`: Capacidad operativa para tareas específicas
- `VIEWER`: Acceso de solo lectura a información permitida

## Flujos de Trabajo

### Creación de Usuario

1. Un administrador crea una solicitud para un nuevo usuario
2. El sistema valida los datos y permisos del administrador
3. Se crea el usuario con estado INACTIVE
4. Se envía invitación al correo electrónico
5. El usuario completa su registro y pasa a estado ACTIVE

### Cambio de Rol

1. Un administrador solicita cambio de rol para un usuario
2. El sistema valida que el administrador tenga permisos
3. Se actualiza el rol del usuario
4. Se registra el cambio en la auditoría
5. Se notifica al usuario afectado

## Ejemplos de Uso

### Crear un Usuario de Compañía

```typescript
// POST /company-users?companyId=X
{
  "authId": "auth0|123456789",
  "fullName": "Juan Pérez",
  "email": "juan.perez@company.com",
  "role": "MANAGER",
  "metadata": {
    "department": "Marketing",
    "location": "Madrid"
  }
}
```

### Actualizar un Usuario

```typescript
// PUT /company-users/{id}?companyId=X
{
  "fullName": "Juan Antonio Pérez",
  "metadata": {
    "department": "Sales",
    "location": "Madrid"
  }
}
```

## Integración con Frontend

El frontend puede integrarse con este módulo a través de:

1. **Panel de Administración**: Para gestión de usuarios por parte de administradores.
2. **Portal de Empresa**: Interfaz para que los usuarios vean a otros miembros.
3. **Perfil de Usuario**: Interfaz personal para gestionar datos propios.

## Documentación Técnica

Consulta la documentación técnica detallada en:
- [Arquitectura del Módulo](./docs/architecture.md)
- [Guía de Autorización](./docs/authorization-guide.md)
- [Flujos de Usuarios](./docs/user-workflows.md)

## Próximos Pasos

- [ ] Implementación de autenticación multifactor
- [ ] Historial detallado de actividad por usuario
- [ ] Gestión de equipos y grupos de usuarios
- [ ] Sistema avanzado de delegación de permisos 