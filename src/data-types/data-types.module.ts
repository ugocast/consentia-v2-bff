import { Module } from '@nestjs/common';
import { DataTypesController } from './data-types.controller';
import { DataTypesService } from './data-types.service';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DataTypesController],
  providers: [DataTypesService],
  exports: [DataTypesService],
})
export class DataTypesModule {}
