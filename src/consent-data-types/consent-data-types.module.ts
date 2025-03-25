import { Module } from '@nestjs/common';
import { ConsentDataTypesController } from './consent-data-types.controller';
import { ConsentDataTypesService } from './consent-data-types.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ConsentDataTypesController],
  providers: [ConsentDataTypesService],
  exports: [ConsentDataTypesService],
})
export class ConsentDataTypesModule {}
