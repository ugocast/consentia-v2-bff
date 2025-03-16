import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { RolesGuard } from './guards/roles.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ParseUUIDPipe } from './pipes/parse-uuid.pipe';

@Module({
  imports: [AuditModule],
  providers: [
    RolesGuard,
    HttpExceptionFilter,
    TransformInterceptor,
    ParseUUIDPipe,
  ],
  exports: [
    AuditModule,
    RolesGuard,
    HttpExceptionFilter,
    TransformInterceptor,
    ParseUUIDPipe,
  ],
})
export class CommonModule {}
