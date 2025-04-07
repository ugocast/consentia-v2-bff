import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SecurityService } from './security.service';
import { AuthAuditMiddleware } from './middleware/auth-audit.middleware';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60, // Tiempo en segundos que los registros permanecen en memoria
      limit: 10, // Número máximo de solicitudes en ese tiempo
      ignoreUserAgents: [
        // Ignorar bots benignos como healthchecks
        /health-check/,
        /monitoring-agent/,
      ],
    }]),
    AuditModule, // Importando AuditModule para poder usar AuditService
  ],
  providers: [
    SecurityService,
    AuthAuditMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [
    SecurityService,
    AuthAuditMiddleware,
  ],
})
export class SecurityModule {} 