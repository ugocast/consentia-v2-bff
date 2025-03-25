import { Module } from '@nestjs/common';
import { ExternalIntegrationsController } from './external-integrations.controller';
import { ExternalIntegrationsService } from './external-integrations.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ExternalIntegrationsController],
  providers: [ExternalIntegrationsService],
  exports: [ExternalIntegrationsService],
})
export class ExternalIntegrationsModule {}
