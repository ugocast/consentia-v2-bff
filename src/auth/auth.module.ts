import { Global, Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditModule } from '../common/audit/audit.module';
import { UsersModule } from '../users/users.module';

@Global() // Esto hace que todos los proveedores de este módulo estén disponibles globalmente
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SUPABASE_JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h')
        },
      }),
      inject: [ConfigService],
    }),
    AuditModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard
  ],
  exports: [
    AuthService,
    JwtAuthGuard
  ],
})
export class AuthModule {}
