import { Module } from '@nestjs/common';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import { CommonModule } from '../common/common.module';
import { PoliciesModule } from '../policies/policies.module';

@Module({
  imports: [CommonModule, PoliciesModule],
  controllers: [ConsentsController],
  providers: [ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
