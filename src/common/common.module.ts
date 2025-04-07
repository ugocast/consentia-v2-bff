import { Module, forwardRef } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
import { RolesGuard } from './guards/roles.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ParseUUIDPipe } from './pipes/parse-uuid.pipe';
import { PermissionsService } from './guards/permissions.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { CompanyContextMiddleware } from './middleware/company-context.middleware';
import { CompanyContextService } from './services/company-context.service';
import { CompanyContextController } from './controllers/company-context.controller';
import { CompanyContextGuard } from './guards/company-context.guard';
import { ApiKeysModule } from './api-keys/api-keys.module';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => ApiKeysModule),
  ],
  controllers: [
    CompanyContextController,
  ],
  providers: [
    RolesGuard,
    HttpExceptionFilter,
    TransformInterceptor,
    ParseUUIDPipe,
    PermissionsService,
    CompanyContextMiddleware,
    CompanyContextService,
    CompanyContextGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [
    AuditModule,
    RolesGuard,
    HttpExceptionFilter,
    TransformInterceptor,
    ParseUUIDPipe,
    PermissionsService,
    CompanyContextMiddleware,
    CompanyContextService,
    CompanyContextGuard,
    forwardRef(() => ApiKeysModule),
  ],
})
export class CommonModule {}
