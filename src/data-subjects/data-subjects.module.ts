import { Module } from '@nestjs/common';
import { DataSubjectsController } from './data-subjects.controller';
import { DataSubjectsService } from './data-subjects.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [DataSubjectsController],
  providers: [DataSubjectsService],
  exports: [DataSubjectsService],
})
export class DataSubjectsModule {}
