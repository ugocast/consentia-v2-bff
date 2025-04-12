# Funcionalidades Pendientes en el BFF de Consentia

## Resumen Ejecutivo

Tras analizar la implementación actual del Backend for Frontend (BFF) de Consentia, los flujos de usuario definidos (`USER_JOURNEYS.md`) y el esquema de base de datos (`SCHEMA_DOCUMENTATION.md`), este documento detalla las funcionalidades del BFF pendientes o que requieren finalización/corrección para soportar completamente la aplicación frontend. Se organiza por áreas funcionales clave.

**Leyenda de Estado:**
*   ✅ Implementado (Funcionalidad principal existe, pruebas unitarias/E2E pueden pasar o requerir ajustes menores).
*   ⏳ Parcialmente Implementado / En Progreso / Necesita Pruebas / Necesita Correcciones (Módulos/endpoints existen pero incompletos, fallan pruebas críticas, baja cobertura, o funcionalidad parcial).
*   ❌ No Implementado (Módulo, endpoint o funcionalidad clave requerida no existe).

---

## 0. Registro y Verificación de Usuario

### 0.1 Registro de Usuario (Auth) ✅
- **Endpoint**: `/api/v1/auth/register` (POST)
- **Descripción**: Permitir que un usuario se registre inicialmente en el sistema (nombre, email, contraseña) sin asociarse inmediatamente a una empresa.
- **Tablas**: `auth_users`
- **Componentes Frontend**: `RegisterForm`, `RegisterPage`
- **Estado**: ✅ (Implementado según el nuevo enfoque secuencial).

### 0.2 Verificación de Email ✅
- **Endpoint**: `/api/v1/auth/verify-email/:token` (GET/POST)
- **Descripción**: Verificar la cuenta del usuario mediante el enlace enviado por correo electrónico.
- **Tablas**: `auth_users`
- **Componentes Frontend**: `EmailVerificationPage`
- **Estado**: ✅ (Implementado según el nuevo enfoque secuencial).

### 0.3 Detección de Estado de Onboarding ✅
- **Endpoint**: `/api/v1/auth/onboarding-status` (GET)
- **Descripción**: Verificar si un usuario autenticado tiene al menos una empresa asociada o necesita completar el onboarding.
- **Tablas**: `auth_users`, `company_user`
- **Componentes Frontend**: `OnboardingRouter`, `DashboardRouter`
- **Estado**: ✅ (Implementado según el nuevo enfoque secuencial).

---

## 1. Gestión de Empresas y Configuraciones

### 1.1 Gestión de Datos de Empresa ✅
- **Endpoints**: `/api/v1/companies`, `/api/v1/companies/:id` (CRUD básico)
- **Descripción**: Crear, leer, actualizar y (potencialmente) desactivar empresas.
- **Tablas**: `company`
- **Componentes Frontend**: `CompanyList`, `CompanyDetail`, `CompanyEditForm`
- **Estado**: ✅ (CRUD básico probablemente soportado por `CompaniesService`, aunque la cobertura de pruebas es baja).

### 1.1b Creación de Empresa por Usuario Registrado ⏳
- **Endpoint**: `/api/v1/users/me/companies` (POST)
- **Descripción**: Permitir que un usuario ya registrado y verificado cree una nueva empresa y sea automáticamente asignado como administrador de la misma.
- **Tablas**: `company`, `company_user`, `user_active_company`
- **Componentes Frontend**: `CreateCompanyForm`, `CompanyOnboardingPage`
- **Estado**: ⏳ (Parcialmente implementado, pero necesita integración con el nuevo flujo de registro secuencial).

### 1.2 Endpoints para Configuración de Empresas ✅
- **Endpoint**: `/api/v1/companies/:id/config` (GET, PUT/PATCH)
- **Descripción**: Leer y actualizar configuraciones personalizadas por empresa (basado en `companyConfiguration`).
- **Tablas**: `companyConfiguration`, `company`
- **Componentes Frontend**: `CompanySettingsForm`, `NotificationSettings`, `BrandingSettings`
- **Estado**: ✅ (Implementado con validaciones según notas anteriores).

### 1.3 Gestión de Planes de Suscripción ✅
- **Endpoint**: `/api/v1/companies/:id/subscription` (GET, PUT/PATCH)
- **Descripción**: Leer y actualizar el plan de suscripción y metadatos de facturación asociados (`company.subscription_plan`, `company.metadata.billing`).
- **Tablas**: `company`
- **Componentes Frontend**: `SubscriptionManager`, `BillingInformation`
- **Estado**: ✅ (Implementado con validaciones según notas anteriores).

### 1.4 Selección de Empresa Activa (Para Usuarios Multi-Empresa) ✅
- **Endpoint**: `/api/v1/users/active-company` (GET, PUT)
- **Descripción**: Permitir a un usuario autenticado (`auth_user`) ver y establecer cuál de sus empresas asociadas (`companyUser`) es la activa para la sesión actual.
- **Tablas**: `userActiveCompany`, `companyUser`, `authUser`
- **Componentes Frontend**: `CompanySelectorDropdown`
- **Estado**: ✅ (Implementada la lógica y endpoints para gestionar la empresa activa del usuario).

---

## 2. Gestión de Usuarios y Roles (Empresa)

### 2.1 CRUD de Usuarios de Empresa ✅
- **Endpoints**: `/api/v1/companies/:companyId/users` (GET, POST), `/api/v1/companies/:companyId/users/:userId` (GET, PATCH, DELETE)
- **Descripción**: Listar, crear, obtener detalles, actualizar (nombre, estado) y eliminar/desactivar usuarios dentro de una empresa.
- **Tablas**: `companyUser`, `authUser`
- **Componentes Frontend**: `UserList`, `UserDetail`, `UserEditForm`, `UserCreateForm`
- **Estado**: ✅ (Funcionalidad principal implementada, aunque pruebas unitarias del controller tenían fallos menores).

### 2.2 Administración de Roles de Usuario ✅
- **Endpoint**: `/api/v1/companies/:companyId/users/:userId/role` (PUT/PATCH)
- **Descripción**: Asignar/cambiar roles específicos (ADMINISTRATOR, OPERATOR, AUDITOR) a un usuario de empresa.
- **Tablas**: `companyUser`
- **Componentes Frontend**: `UserRoleSelector` (en `UserDetail` o `UserEditForm`)
- **Estado**: ✅ (Implementado según análisis anterior).

### 2.3 Gestión de Perfil de Usuario Propio ⏳
- **Endpoint**: `/api/v1/users/me` o `/api/v1/companies/:companyId/users/me` (GET, PATCH)
- **Descripción**: Permitir a un usuario autenticado ver y actualizar su propio perfil (nombre, email asociado a `companyUser`, preferencias en `metadata`).
- **Tablas**: `companyUser`, `authUser`
- **Componentes Frontend**: `UserProfileForm`
- **Estado**: ⏳ (El endpoint específico `/me` podría no existir; la funcionalidad de actualización fallaba en pruebas según análisis previo).

### 2.4 Invitaciones de Usuario ✅
- **Endpoint**: `/api/v1/companies/:companyId/invitations` (POST, GET), `/api/v1/invitations/:token/accept` (POST)
- **Descripción**: Crear y gestionar invitaciones para que usuarios (existentes o nuevos) se unan a una empresa. El proceso debe:
  - Verificar si el email invitado ya corresponde a un usuario existente en `auth_users`
  - Si existe: enviar notificación para unirse a la empresa y solo requerir aceptación
  - Si no existe: enviar email de invitación para registrarse y luego unirse a la empresa
- **Tablas**: `company_user` (con estado 'INVITED'), tabla `invitations`, `auth_users`
- **Componentes Frontend**: `UserInviteForm`, `InvitationList`, `InvitationAcceptPage`
- **Estado**: ✅ (Implementado con sistema completo de gestión de invitaciones, incluyendo notificaciones por email).

---

## 3. Gestión de Políticas Legales

### 3.1 CRUD de Políticas Legales ⏳
- **Endpoints**: `/api/v1/companies/:companyId/policies` (GET, POST), `/api/v1/companies/:companyId/policies/:policyId` (GET, PUT/PATCH, DELETE)
- **Descripción**: Crear, listar, ver, actualizar (incluyendo versionado implícito o explícito) y gestionar el estado (DRAFT, ACTIVE, INACTIVE, etc.) de las políticas legales.
- **Tablas**: `legalPolicy`
- **Componentes Frontend**: `PolicyList`, `PolicyEditor`, `PolicyDetail`
- **Estado**: ⏳ (Controller existe, pero servicio con muy baja cobertura y funcionalidad probablemente incompleta).

### 3.2 Establecer Política Activa para Empresa ⏳
- **Endpoint**: `/api/v1/companies/:companyId/active-policy` (PUT)
- **Descripción**: Designar una política legal específica (`legal_policy_id`) como la activa para una empresa (`company.active_policy_id`).
- **Tablas**: `company`, `legalPolicy`
- **Componentes Frontend**: Botón "Set Active" en `PolicyList` o `PolicyDetail`.
- **Estado**: ⏳ (Depende de `CompaniesService` y `PoliciesService`, cobertura baja).

---

## 4. Gestión de Sujetos de Datos (Data Subjects)

### 4.1 CRUD de Sujetos de Datos ⏳
- **Endpoints**: `/api/v1/companies/:companyId/data-subjects` (GET, POST), `/api/v1/companies/:companyId/data-subjects/:subjectId` (GET, PATCH, DELETE)
- **Descripción**: Listar, buscar (por email/nombre), crear, obtener detalles, actualizar y gestionar el estado (ACTIVE, INACTIVE, DELETED) de los sujetos de datos asociados a una empresa.
- **Tablas**: `dataSubject`
- **Componentes Frontend**: `DataSubjectList`, `DataSubjectSearch`, `DataSubjectDetail`, `DataSubjectForm`
- **Estado**: ⏳ (Controller existe, pero con errores en pruebas unitarias y servicio con cobertura muy baja).

### 4.2 Solicitud de Acceso al Portal (End User) ⏳
- **Endpoint**: `/api/v1/data-subjects/portal/request-access` (POST)
- **Descripción**: Endpoint público donde un sujeto de datos puede solicitar acceso a su portal de autogestión (ej. ingresando su email). Desencadena un flujo de verificación (ej. envío de email con enlace).
- **Tablas**: `dataSubject`, `authUser` (potencialmente)
- **Componentes Frontend**: `RequestPortalAccessForm`
- **Estado**: ⏳ (Implementado en el backend, pero falta completar el envío de correos y la integración con el frontend).

### 4.3 Verificación de Acceso al Portal (End User) ⏳
- **Endpoint**: `/api/v1/data-subjects/portal/verify` (POST)
- **Descripción**: Endpoint donde el usuario confirma su identidad (ej. usando un token del enlace de verificación) para obtener un token de sesión para el portal.
- **Tablas**: `dataSubject`, `authUser` (potencialmente)
- **Componentes Frontend**: Página de Carga/Verificación
- **Estado**: ⏳ (Implementado en el backend, pero falta integración con el frontend).

### 4.4 Solicitud de Eliminación de Datos (End User / Company User) ⏳
- **Endpoint**: `/api/v1/data-subjects/:subjectId/request-deletion` (POST) (o endpoint para usuario autenticado `/me/request-deletion`)
- **Descripción**: Iniciar una solicitud para eliminar los datos de un sujeto. El BFF debe manejar la lógica de validación (retenciones legales) y actualizar el estado o anonimizar datos según corresponda.
- **Tablas**: `dataSubject`, `consent`, potencialmente otras relacionadas.
- **Componentes Frontend**: Botón "Request Deletion" en `DataSubjectDetail` o Portal de Usuario.
- **Estado**: ⏳ (Funcionalidad mencionada en User Journey pero no claramente implementada en el servicio `DataSubjectsService` existente, que tiene baja cobertura).

---

## 5. Gestión de Consentimientos

### 5.1 Crear Solicitud de Consentimiento (Company User) ⏳
- **Endpoint**: `/api/v1/companies/:companyId/consents/request` (POST)
- **Descripción**: Crear un nuevo registro de consentimiento, especificando el `data_subject_id`, `legal_policy_id`, `purpose`, `channel`, `data_type_ids` asociados. Inicialmente en estado 'PENDING' o similar. Podría desencadenar notificación.
- **Tablas**: `consent`, `consentDataType`, `dataSubject`, `legalPolicy`
- **Componentes Frontend**: `CreateConsentRequestForm`
- **Estado**: ⏳ (Depende críticamente de `ConsentsService`, que tiene baja cobertura).

### 5.2 Obtener Detalles de Solicitud (Para End User) ⏳
- **Endpoint**: `/api/v1/consents/public/:token` (GET) o similar ruta pública/segura.
- **Descripción**: Obtener los detalles de una solicitud de consentimiento específica para mostrarla al usuario final (usando un token único enviado por email/SMS). Debe incluir detalles de la política, propósito, tipos de datos.
- **Tablas**: `consent`, `legalPolicy`, `dataType` (via `consentDataType`)
- **Componentes Frontend**: Página Pública de Solicitud de Consentimiento.
- **Estado**: ⏳ (Depende de `ConsentsService`, baja cobertura, endpoint público específico probablemente no existe).

### 5.3 Responder a Solicitud (End User) ⏳
- **Endpoint**: `/api/v1/consents/public/:token/respond` (POST)
- **Descripción**: Endpoint público para que el usuario final envíe su respuesta (ACCEPTED/REJECTED) a una solicitud. Actualiza el estado del `consent` y registra en `auditLog`.
- **Tablas**: `consent`, `auditLog`
- **Componentes Frontend**: Botones Accept/Reject en Página Pública de Solicitud.
- **Estado**: ⏳ (Depende de `ConsentsService` y `AuditService`, `ConsentsService` con baja cobertura).

### 5.4 Listar/Filtrar Consentimientos (Company User Dashboard) ⏳
- **Endpoint**: `/api/v1/companies/:companyId/consents` (GET)
- **Descripción**: Obtener una lista de consentimientos para la empresa, con filtros por `data_subject_id`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `REVOKED`, `EXPIRED`), `legal_policy_id`, `channel`, rango de fechas.
- **Tablas**: `consent`, `dataSubject`, `legalPolicy`
- **Componentes Frontend**: `ConsentDashboard`, `ConsentList`, `ConsentFilters`
- **Estado**: ⏳ (Lógica de filtrado avanzada probablemente no implementada o probada en `ConsentsService`).

### 5.5 Obtener Historial de Consentimiento (End User Portal) ⏳
- **Endpoint**: `/api/v1/data-subjects/me/consents` (GET)
- **Descripción**: Obtener el historial completo de consentimientos (todos los estados) para el sujeto de datos autenticado.
- **Tablas**: `consent`, `legalPolicy`
- **Componentes Frontend**: `UserConsentHistoryList` (en Portal de Usuario).
- **Estado**: ⏳ (Depende de `ConsentsService` y autenticación de Data Subject).

### 5.6 Revocar Consentimiento (End User Portal / Company User) ⏳
- **Endpoint**: `/api/v1/consents/:consentId/revoke` (POST o PATCH) (con endpoints separados para `/me/consents/:id/revoke` y `/companies/:cid/consents/:id/revoke`)
- **Descripción**: Cambiar el estado de un consentimiento `ACCEPTED` a `REVOKED`. Debe registrarse en `auditLog`.
- **Tablas**: `consent`, `auditLog`
- **Componentes Frontend**: Botón "Revoke" en `UserConsentHistoryList` o `ConsentDetailView` (dashboard empresa).
- **Estado**: ⏳ (Depende de `ConsentsService` y `AuditService`).

---

## 6. Gestión de Tipos de Datos

### 6.1 CRUD de Tipos de Datos ⏳
- **Endpoint**: `/api/v1/data-types` (GET, POST), `/api/v1/data-types/:id` (GET, PUT/PATCH, DELETE)
- **Descripción**: Administrar los tipos de datos globales disponibles para asociar a consentimientos.
- **Tablas**: `dataType`
- **Componentes Frontend**: `DataTypeManager`, `DataTypeList`, `DataTypeForm`
- **Estado**: ⏳ (Servicio parcialmente implementado, pruebas unitarias fallan, baja cobertura).

### 6.2 Asociar/Desasociar Tipos de Datos a Consentimiento ⏳
- **Endpoint**: `/api/v1/consents/:consentId/data-types` (GET, POST, DELETE) o similar. POST podría aceptar un array de `data_type_id`s, DELETE podría aceptar un `data_type_id` específico.
- **Descripción**: Ver, añadir o quitar asociaciones entre un consentimiento específico y los tipos de datos (`consentDataType` tabla de unión).
- **Tablas**: `consentDataType`, `consent`, `dataType`
- **Componentes Frontend**: Selector/Multiselector en `CreateConsentRequestForm`, `ConsentDetailView`.
- **Estado**: ⏳ (Depende de `ConsentsService` y `DataTypesService`).

---

## 7. Operaciones Masivas y Automatización

### 7.1 Gestión de Operaciones Masivas ✅
- **Endpoints**: `/api/v1/companies/:companyId/bulk-operations` (CRUD)
- **Descripción**: Crear, monitorear y gestionar operaciones masivas (ej. creación masiva de solicitudes de consentimiento).
- **Tablas**: (Requiere tabla `bulk_operation`, no documentada en esquema revisado pero implícita por el módulo existente).
- **Componentes Frontend**: `BulkOperationDashboard`, `BulkOperationStatus`
- **Estado**: ✅ (Módulo existe y pruebas unitarias pasan. Pruebas E2E fallan por auth/context).

### 7.2 Procesar Operación Masiva ✅
- **Endpoint**: `/api/v1/companies/:companyId/bulk-operations/:id/process` (POST)
- **Descripción**: Iniciar el procesamiento de una operación masiva definida.
- **Tablas**: `bulk_operation`, `consent`, etc.
- **Componentes Frontend**: Botón "Process" en `BulkOperationDashboard`.
- **Estado**: ✅ (Endpoint existe en el controller).

### 7.3 Gestión de Plantillas de Comunicación ❌
- **Endpoint**: `/api/v1/companies/:companyId/templates` (CRUD)
- **Descripción**: Crear y administrar plantillas (Email, SMS) para solicitudes de consentimiento, recordatorios, confirmaciones.
- **Tablas**: (Requiere nueva tabla `communication_template`).
- **Componentes Frontend**: `TemplateEditor`, `TemplateList`.
- **Estado**: ❌ (No Implementado).

### 7.4 Sistema de Recordatorios (Trigger) ❌
- **Endpoint**: (Probablemente una tarea programada/interna, pero podría haber un endpoint para configurar/ver estado) `/api/v1/companies/:companyId/reminders/config` (GET, PUT).
- **Descripción**: Funcionalidad para enviar recordatorios automáticos o manuales (trigger) para consentimientos pendientes. Usaría las plantillas (#7.3).
- **Tablas**: `consent`, `communication_template`.
- **Componentes Frontend**: `ReminderSettings`, Botón "Send Reminders" en `ConsentDashboard`.
- **Estado**: ❌ (No Implementado).

---

## 8. Reportes, Exportación y Auditoría

### 8.1 Generar Reporte de Consentimientos ✅
- **Endpoint**: `/api/v1/reports/consents` (GET, con query params para filtros)
- **Descripción**: Generar un reporte/exportación de consentimientos basado en filtros.
- **Tablas**: `consent`, `dataSubject`, `legalPolicy`
- **Componentes Frontend**: `ReportGenerator`, `ExportOptions`.
- **Estado**: ✅ (Implementado, pruebas E2E pasan).

### 8.2 Generar Reporte de Auditoría ✅
- **Endpoint**: `/api/v1/reports/audit` (GET, con query params para filtros básicos)
- **Descripción**: Generar un reporte/exportación del log de auditoría.
- **Tablas**: `auditLog`, `companyUser`, `dataSubject`
- **Componentes Frontend**: `ReportGenerator`, `ExportOptions`.
- **Estado**: ✅ (Implementado, pruebas E2E pasan).

### 8.3 Generar Reporte de Métricas ✅
- **Endpoint**: `/api/v1/reports/metrics` (GET, con query params para filtros de fecha/periodo)
- **Descripción**: Generar métricas clave (tasas de aceptación, consentimientos activos, etc.).
- **Tablas**: `consent`, `legalPolicy`, etc.
- **Componentes Frontend**: `DashboardWidgets`, `MetricsDisplay`.
- **Estado**: ✅ (Implementado, pruebas E2E pasan).

### 8.4 Consultas Avanzadas de Auditoría ⏳
- **Endpoint**: `/api/v1/reports/audit` (Mejorar con filtros más avanzados: por tipo de acción, recurso específico, etc.)
- **Descripción**: Permitir filtros más granulares en el reporte de auditoría.
- **Tablas**: `auditLog`
- **Componentes Frontend**: `AdvancedAuditFilter`.
- **Estado**: ⏳ (Endpoint básico existe, filtros avanzados no implementados).

### 8.5 Generación de PDFs de Consentimiento ❌
- **Endpoint**: `/api/v1/consents/:consentId/pdf` (GET)
- **Descripción**: Generar un documento PDF que represente el estado y los detalles de un consentimiento específico en un momento dado.
- **Tablas**: `consent`, `legalPolicy`, `dataSubject`, `dataType`
- **Componentes Frontend**: Botón "Download PDF" en `ConsentDetailView`, `UserConsentHistoryList`.
- **Estado**: ❌ (No Implementado).

---

## 9. Integraciones Externas

### 9.1 CRUD de Integraciones ⏳
- **Endpoint**: `/api/v1/companies/:companyId/integrations` (CRUD)
- **Descripción**: Administrar la configuración de integraciones con sistemas externos.
- **Tablas**: `externalIntegration`
- **Componentes Frontend**: `IntegrationList`, `IntegrationForm`, `IntegrationCard`.
- **Estado**: ⏳ (Servicio parcialmente implementado, pruebas unitarias fallan, baja cobertura).

### 9.2 Gestión de API Keys para Integraciones ⏳
- **Endpoint**: `/api/v1/api-keys` (CRUD) o `/companies/:companyId/integrations/:integrationId/api-keys`
- **Descripción**: Generar, listar, revocar API keys asociadas a una integración o a la empresa para acceso programático.
- **Tablas**: (Requiere tabla `api_keys` o similar, no documentada explícitamente pero módulo `ApiKeys` existe). `externalIntegration` si las keys son por integración.
- **Componentes Frontend**: `ApiKeyManager`.
- **Estado**: ⏳ (Módulo y servicio `ApiKeys` existen, pero pruebas unitarias fallan por tipos, baja cobertura).

### 9.3 Configuración de Webhooks ❌
- **Endpoint**: `/api/v1/companies/:companyId/integrations/:integrationId/webhooks` (CRUD)
- **Descripción**: Configurar URLs de callback (`externalIntegration.callback_url`) y potencialmente los eventos que las disparan (`externalIntegration.metadata.webhook.events`?).
- **Tablas**: `externalIntegration`
- **Componentes Frontend**: `WebhookConfigurator`.
- **Estado**: ❌ (No Implementado).

---

## 10. Funcionalidades Adicionales / Pendientes

### 10.1 Panel de Tareas para Operadores ❌
- **Endpoint**: `/api/v1/companies/:companyId/tasks` (GET)
- **Descripción**: Un endpoint que agregue acciones pendientes o elementos que requieran atención para los operadores (ej., consentimientos expirando pronto, solicitudes de eliminación pendientes de revisión, etc.).
- **Tablas**: Múltiples (requiere lógica de agregación).
- **Componentes Frontend**: `TaskList`, `DashboardNotifications`.
- **Estado**: ❌ (No Implementado).

### 10.2 Mejoras Pendientes en Seguridad (Backend) ⏳/❌
- **Descripción**: Implementar las mejoras de seguridad listadas en la sección "Próximos Pasos" del documento original (límites por plan, validación estado suscripción, rate limiting, encriptación, etc.). No son endpoints directos, pero afectan la robustez general.
- **Estado**: ⏳/❌ (Algunas validaciones básicas pueden existir, pero la mayoría probablemente no están implementadas).

---

## Priorización Recomendada (Revisada)

1.  **Flujo de Registro y Onboarding Secuencial (✅ Implementado)**: 
    *   ✅ Implementar registro de usuario independiente (#0.1)
    *   ✅ Implementar verificación de correo electrónico (#0.2)
    *   ✅ Implementar detección de estado de onboarding (#0.3)
    *   ⏳ Implementar creación de empresa para usuario existente (#1.1b)
    *   ✅ Implementar sistema de invitaciones para usuarios existentes/nuevos (#2.4)
    *   ✅ Implementar selección de empresa activa (#1.4)

2.  **Estabilización y Cobertura (Prioridad Crítica)**: ⏳
    *   Corregir **TODOS** los fallos en pruebas unitarias y E2E existentes (Bulk Ops E2E, Services, Controllers).
    *   Incrementar significativamente la cobertura de pruebas unitarias para **TODOS** los servicios críticos (`Consents`, `DataSubjects`, `Policies`, `Companies`, `CompanyUsers`, `ExternalIntegrations`, `ApiKeys`, `DataTypes`).

3.  **Core Consent & Policy Lifecycle (Prioridad Alta)**: ⏳ / ❌
    *   Finalizar `PoliciesService` y endpoints CRUD (#3.1, #3.2).
    *   Finalizar `ConsentsService` para CRUD básico, obtención de detalles, respuesta y revocación (#5.1, #5.2, #5.3, #5.6).
    *   Finalizar `DataSubjectsService` para CRUD básico (#4.1).
    *   Implementar asociación de `DataType` a `Consent` (#6.2).

4.  **Funcionalidades Esenciales Dashboard Empresa (Prioridad Media-Alta)**: ⏳
    *   Mejorar/Probar listado/filtrado de Consentimientos (#5.4).
    *   Mejorar/Probar listado/filtrado de Data Subjects (#4.1).
    *   Asegurar funcionamiento de gestión de usuarios/roles (#2.1, #2.2).

5.  **Portal Usuario Final (Prioridad Media)**: ⏳
    *   Completar integración y pruebas del flujo de acceso/verificación (#4.2, #4.3).
    *   Implementar funcionalidad de envío de correos para el portal de usuario.
    *   Implementar obtención de historial de consentimientos (#5.5).
    *   Implementar solicitud de eliminación (#4.4).

6.  **Funcionalidades Avanzadas y Complementarias (Prioridad Baja/Media-Baja)**: ⏳ / ❌
    *   Integraciones Externas (CRUD, API Keys, Webhooks) (#9).
    *   Gestión de Plantillas y Recordatorios (#7.3, #7.4).
    *   Generación de PDFs (#8.5).
    *   Panel de Tareas (#10.1).
    *   Filtros Avanzados de Auditoría (#8.4).
    *   Selección Empresa Activa (#1.4).

## Conclusión

Este documento actualizado refleja una visión más completa de las funcionalidades requeridas por el BFF para soportar los flujos de usuario definidos. La **fase inicial de implementación del nuevo flujo de registro secuencial** se ha completado exitosamente, proporcionando:

1. Una mejor gestión de usuarios con cuentas en múltiples empresas
2. Un proceso de onboarding más organizado y guiado
3. Mayor flexibilidad para usuarios invitados que ya tienen cuenta en el sistema
4. Un sistema completo de gestión de invitaciones con notificaciones por email

Adicionalmente, se ha identificado que gran parte de la funcionalidad para el portal de usuario final (titular de datos) está implementada en el backend, pero requiere completar la integración con el frontend y finalizar detalles como el envío de notificaciones por correo.

Es necesario continuar con la estabilización del código existente y el aumento de la cobertura de pruebas, enfocándose ahora en las funcionalidades de gestión de consentimientos y políticas legales, que constituyen el núcleo del valor agregado del sistema. Este documento debe servir como hoja de ruta actualizada para el desarrollo tanto del backend como del frontend. 