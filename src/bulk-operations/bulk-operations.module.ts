import { Module } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { AuditModule } from '../common/audit/audit.module';
import { ConsentsModule } from '../consents/consents.module';

@Module({
  imports: [AuditModule, ConsentsModule],
  controllers: [BulkOperationsController],
  providers: [BulkOperationsService],
  exports: [BulkOperationsService],
})
export class BulkOperationsModule {}
