import { Module, forwardRef } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { CompanyUsersModule } from '../company-users/company-users.module';
import { EmailModule } from '../common/services/email/email.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CommonModule,
    EmailModule,
    ConfigModule,
    forwardRef(() => AuthModule),
    forwardRef(() => CompanyUsersModule)
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {} 