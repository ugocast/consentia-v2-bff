# Guía de Autorización para Company Users

Este documento detalla el sistema de autorización implementado en el módulo Company Users, describiendo roles, permisos, y cómo se aplican en diferentes operaciones.

## Modelo de Autorización

El módulo utiliza un sistema de autorización basado en roles (RBAC - Role-Based Access Control) con verificación adicional de pertenencia a compañía. Este enfoque proporciona un equilibrio entre flexibilidad y seguridad.

### Componentes del Sistema

1. **Roles**: Definen conjuntos predefinidos de permisos (ADMIN, MANAGER, OPERATOR, VIEWER)
2. **Permisos**: Capacidades específicas para realizar acciones
3. **Políticas**: Reglas que determinan si una acción está permitida
4. **Guardias**: Componentes que verifican permisos en puntos de entrada de la API

## Roles y Permisos

### ADMIN
- **Descripción**: Administrador con control total sobre los usuarios de la compañía
- **Permisos**:
  - Crear, leer, actualizar y eliminar cualquier usuario
  - Asignar y modificar roles de usuarios
  - Ver información completa de usuarios
  - Gestionar configuraciones de compañía

### MANAGER
- **Descripción**: Gestor con capacidades amplias pero limitadas
- **Permisos**:
  - Leer información de todos los usuarios
  - Crear nuevos usuarios (solo con roles OPERATOR o VIEWER)
  - Actualizar información básica de usuarios
  - No puede eliminar usuarios ni modificar roles de nivel ADMIN

### OPERATOR
- **Descripción**: Operador con capacidades de trabajo diario
- **Permisos**:
  - Leer información limitada de otros usuarios
  - Actualizar su propia información
  - No puede crear, eliminar ni modificar roles

### VIEWER
- **Descripción**: Visualizador con acceso de solo lectura
- **Permisos**:
  - Ver listado básico de usuarios
  - Acceder a su propio perfil
  - Sin capacidad de modificación

## Matriz de Permisos

| Permiso | ADMIN | MANAGER | OPERATOR | VIEWER |
|---------|-------|---------|----------|--------|
| company_users.create | ✓ | ✓ (limitado) | ✗ | ✗ |
| company_users.read_all | ✓ | ✓ | ✓ (limitado) | ✓ (básico) |
| company_users.read_detail | ✓ | ✓ | ✓ (limitado) | ✗ |
| company_users.update_any | ✓ | ✗ | ✗ | ✗ |
| company_users.update_subordinate | ✓ | ✓ | ✗ | ✗ |
| company_users.update_self | ✓ | ✓ | ✓ | ✗ |
| company_users.delete | ✓ | ✗ | ✗ | ✗ |
| company_users.change_role | ✓ | ✗ | ✗ | ✗ |

## Implementación Técnica

### Guards de Autorización

El módulo implementa varios guardias para proteger los endpoints:

1. **JwtAuthGuard**: Verifica la autenticación del usuario mediante token JWT
2. **RolesGuard**: Verifica que el usuario tenga el rol requerido
3. **CompanyAccessGuard**: Verifica que el usuario pertenezca a la compañía solicitada
4. **PermissionGuard**: Verifica permisos específicos para operaciones

### Ejemplo de Uso en Controladores

```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard, CompanyAccessGuard)
@Roles(CompanyUserRole.ADMIN, CompanyUserRole.MANAGER)
@RequirePermissions('company_users.create')
create(
  @Body() createCompanyUserDto: CreateCompanyUserDto,
  @Query('companyId') companyId: string,
  @Req() req: any,
): Promise<CompanyUserDto> {
  // Implementación
}
```

### Verificación de Permisos en Servicios

Además de los guards en el nivel de controlador, el servicio realiza verificaciones adicionales:

```typescript
async update(companyId: string, id: string, updateDto: UpdateCompanyUserDto, currentUserId: string): Promise<CompanyUserDto> {
  // Obtener usuario actual y usuario a modificar
  const currentUser = await this.getCurrentUser(currentUserId);
  const targetUser = await this.findOne(companyId, id);
  
  // Verificar permisos específicos basados en relación entre usuarios
  if (currentUser.role !== CompanyUserRole.ADMIN) {
    if (currentUser.id !== targetUser.id) {
      // Verificar si es MANAGER y el target no es ADMIN
      if (
        currentUser.role === CompanyUserRole.MANAGER && 
        targetUser.role === CompanyUserRole.ADMIN
      ) {
        throw new ForbiddenException('No puede modificar usuarios con rol superior');
      }
      
      // Otros no pueden modificar a otros
      if (currentUser.role !== CompanyUserRole.MANAGER) {
        throw new ForbiddenException('Solo puede modificar su propio perfil');
      }
    }
    
    // Restricciones sobre campos modificables según rol
    this.validateAllowedFieldsForUpdate(currentUser.role, updateDto);
  }
  
  // Proceder con la actualización...
}
```

## Políticas de Autorización

Las políticas determinan reglas más complejas que simples roles:

1. **Jerarquía de roles**: Define que roles superiores pueden operar sobre roles inferiores
   - ADMIN > MANAGER > OPERATOR > VIEWER

2. **Auto-modificación**: Reglas especiales para modificación del propio perfil
   - Todos pueden ver su perfil
   - ADMIN, MANAGER y OPERATOR pueden modificar su perfil
   - Nadie puede cambiar su propio rol

3. **Pertenencia a compañía**: Acceso restringido a usuarios de la misma compañía
   - Incluso un ADMIN solo puede operar sobre usuarios de su compañía

## Validación de Datos

Además de los permisos, el sistema aplica validación basada en roles:

1. **Campos permitidos**: Restricción de campos modificables según rol
2. **Valores permitidos**: Restricción de valores válidos según rol
3. **Operaciones contextuales**: Validaciones que dependen del contexto

## Auditoría de Acceso

Todas las operaciones de autorización son registradas:

1. **Accesos exitosos**: Registro de operaciones completadas
2. **Intentos fallidos**: Registro de intentos de acceso denegados
3. **Cambios de permisos**: Registro especial de modificaciones de roles

## Buenas Prácticas

1. **Principio de mínimo privilegio**: Asignar solo los permisos necesarios
2. **Verificación en múltiples capas**: Validar tanto en controladores como en servicios
3. **Auditoría exhaustiva**: Registrar todos los cambios de permisos
4. **Documentación clara**: Mantener actualizada la documentación de permisos 