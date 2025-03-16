import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CommonModule } from '../common/common.module';
import { ConsentsModule } from '../consents/consents.module';

@Module({
  imports: [CommonModule, ConsentsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
