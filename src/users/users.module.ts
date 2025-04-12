import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditModule } from '../common/audit/audit.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    AuditModule,
    CompaniesModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
