import { Module } from '@nestjs/common';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import { CommonModule } from '../common/common.module';
import { PoliciesModule } from '../policies/policies.module';
import { AuditModule } from '../common/audit/audit.module';
import { EmailModule } from '../common/services/email/email.module';

@Module({
  imports: [CommonModule, PoliciesModule, AuditModule, EmailModule],
  controllers: [ConsentsController],
  providers: [ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
