import { Module, forwardRef } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuditModule, forwardRef(() => AuthModule)],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {} 