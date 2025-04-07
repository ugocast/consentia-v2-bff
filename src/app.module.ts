import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PoliciesModule } from './policies/policies.module';
import { ConsentsModule } from './consents/consents.module';
import { ReportsModule } from './reports/reports.module';
import { CommonModule } from './common/common.module';
import { CompaniesModule } from './companies/companies.module';
import { DataTypesModule } from './data-types/data-types.module';
import { BulkOperationsModule } from './bulk-operations/bulk-operations.module';
import { ExternalIntegrationsModule } from './external-integrations/external-integrations.module';
import { CompanyUsersModule } from './company-users/company-users.module';
import { ConsentDataTypesModule } from './consent-data-types/consent-data-types.module';
import { DataSubjectsModule } from './data-subjects/data-subjects.module';
import { CompanyContextMiddleware } from './common/middleware/company-context.middleware';
import { CompanyFilterInterceptor } from './common/interceptors/company-filter.interceptor';
import { AuthAuditMiddleware } from './common/security/middleware/auth-audit.middleware';
import { SecurityModule } from './common/security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    SecurityModule,
    AuthModule,
    UsersModule,
    PoliciesModule,
    ConsentsModule,
    ReportsModule,
    CompaniesModule,
    DataTypesModule,
    BulkOperationsModule,
    ExternalIntegrationsModule,
    CompanyUsersModule,
    ConsentDataTypesModule,
    DataSubjectsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CompanyFilterInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware de contexto de empresa a todas las rutas excepto autenticación
    consumer
      .apply(CompanyContextMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/reset-password', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.POST }
      )
      .forRoutes('*');
      
    // Aplicar middleware de auditoría de autenticación solo a rutas de auth
    consumer
      .apply(AuthAuditMiddleware)
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/reset-password', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.POST }
      );
  }
}
