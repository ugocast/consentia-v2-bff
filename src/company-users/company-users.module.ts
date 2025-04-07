import { Module, forwardRef } from '@nestjs/common';
import { CompanyUsersController } from './company-users.controller';
import { CompanyUsersService } from './company-users.service';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [CompanyUsersController],
  providers: [CompanyUsersService],
  exports: [CompanyUsersService],
})
export class CompanyUsersModule {}
