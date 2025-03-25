import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
import { RolesGuard } from './guards/roles.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ParseUUIDPipe } from './pipes/parse-uuid.pipe';
import { PermissionsService } from './guards/permissions.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Module({
  imports: [AuditModule],
  providers: [
    RolesGuard,
    HttpExceptionFilter,
    TransformInterceptor,
    ParseUUIDPipe,
    PermissionsService,
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
  ],
})
export class CommonModule {}
