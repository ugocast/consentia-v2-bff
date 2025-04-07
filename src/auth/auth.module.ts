import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { appConfig } from '../config/app.config';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import { PermissionsService } from './permissions/permissions.service';
import { CompanyUsersModule } from '../company-users/company-users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: appConfig.jwt.secret,
      signOptions: { expiresIn: appConfig.jwt.expiresIn },
    }),
    forwardRef(() => UsersModule),
    forwardRef(() => CompanyUsersModule),
    forwardRef(() => CommonModule),
  ],
  providers: [
    AuthService, 
    JwtStrategy,
    PermissionsService
  ],
  controllers: [AuthController],
  exports: [
    AuthService, 
    JwtModule,
    PermissionsService
  ],
})
export class AuthModule {}
