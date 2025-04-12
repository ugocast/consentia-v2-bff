import { Body, Controller, Headers, Post, UseGuards, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  RegisterResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  ResetPasswordResponseDto,
  UpdatePasswordResponseDto,
  RefreshTokenResponseDto,
  AuthErrorResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
  OnboardingStatusResponseDto
} from './dto';
import { JwtGuard } from './jwt/jwt.guard';
import { SkipCompanyContext } from '../common/decorators/company-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
@SkipCompanyContext()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario registrado exitosamente',
    type: RegisterResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos de registro inválidos',
    type: AuthErrorResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'El email ya está registrado',
    type: AuthErrorResponseDto 
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Verificar email de usuario' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verificado exitosamente',
    type: VerifyEmailResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Token inválido o expirado',
    type: AuthErrorResponseDto 
  })
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @ApiOperation({ summary: 'Verificar estado de onboarding del usuario' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de onboarding obtenido exitosamente',
    type: OnboardingStatusResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado',
    type: AuthErrorResponseDto 
  })
  @Get('onboarding-status')
  @UseGuards(JwtGuard)
  async getOnboardingStatus(@CurrentUser() user: any): Promise<OnboardingStatusResponseDto> {
    return this.authService.getOnboardingStatus(user.id);
  }

  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Inicio de sesión exitoso',
    type: LoginResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas',
    type: AuthErrorResponseDto 
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesión cerrada exitosamente',
    type: LogoutResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido o expirado',
    type: AuthErrorResponseDto 
  })
  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(@Headers('authorization') authorization: string): Promise<LogoutResponseDto> {
    const token = authorization.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Solicitud de restablecimiento enviada',
    type: ResetPasswordResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Email inválido',
    type: AuthErrorResponseDto 
  })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Actualizar contraseña' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña actualizada exitosamente',
    type: UpdatePasswordResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos',
    type: AuthErrorResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido o expirado',
    type: AuthErrorResponseDto 
  })
  @Post('update-password')
  @UseGuards(JwtGuard)
  async updatePassword(
    @Headers('authorization') authorization: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<UpdatePasswordResponseDto> {
    const token = authorization.replace('Bearer ', '');
    return this.authService.updatePassword(token, updatePasswordDto);
  }

  @ApiOperation({ summary: 'Refrescar token de autenticación' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        refresh_token: {
          type: 'string',
          example: 'eFYu_mVN9rlYhWnqTJHQog'
        }
      },
      required: ['refresh_token']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refrescado exitosamente',
    type: RefreshTokenResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de refresco inválido',
    type: AuthErrorResponseDto 
  })
  @Post('refresh-token')
  async refreshToken(@Body() body: { refresh_token: string }): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(body.refresh_token);
  }

  @ApiOperation({ summary: 'Reenviar email de verificación' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Email de verificación reenviado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        message: {
          type: 'string',
          example: 'Email de verificación enviado'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error al reenviar email',
    type: AuthErrorResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado',
    type: AuthErrorResponseDto 
  })
  @Post('resend-verification-email')
  @UseGuards(JwtGuard)
  async resendVerificationEmail(@CurrentUser() user: any): Promise<{ success: boolean, message: string }> {
    return this.authService.resendVerificationEmail(user.id);
  }
}
