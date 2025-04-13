import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OnboardingStatusResponseDto, SyncUserDataDto, SyncUserDataResponseDto, AuthErrorResponseDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SkipCompanyContext } from '../common/decorators/company-context.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

/**
 * Controlador de autenticación
 * 
 * Proporciona endpoints complementarios para operaciones de autenticación
 * que requieren integración con la lógica de negocio.
 * 
 * Nota: Las operaciones básicas de autenticación (registro, login, logout, etc.)
 * son manejadas directamente por el frontend usando Supabase Auth.
 */
@ApiTags('auth')
@Controller('auth')
@SkipCompanyContext()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Obtiene el estado de onboarding del usuario actual
   * 
   * Este endpoint permite al frontend determinar en qué punto del proceso
   * de onboarding se encuentra el usuario y qué pasos debe completar.
   */
  @ApiOperation({
    summary: 'Obtener estado de onboarding del usuario',
    description: 'Proporciona información sobre el estado de verificación de email y pertenencia a compañías'
  })
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
  @UseGuards(JwtAuthGuard)
  async getOnboardingStatus(@CurrentUser() user: any): Promise<OnboardingStatusResponseDto> {
    return this.authService.getOnboardingStatus(user.id);
  }

  /**
   * Sincroniza datos de usuario entre Supabase Auth y el BFF
   * 
   * Este endpoint permite mantener sincronizados los datos del usuario
   * entre Supabase Auth y las tablas de dominio del BFF.
   */
  @ApiOperation({
    summary: 'Sincronizar datos de usuario',
    description: 'Actualiza metadatos del usuario en Supabase Auth y los sincroniza con el BFF'
  })
  @ApiBearerAuth()
  @ApiBody({ type: SyncUserDataDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos de usuario sincronizados exitosamente',
    type: SyncUserDataResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado',
    type: AuthErrorResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado',
    type: AuthErrorResponseDto 
  })
  @Post('sync-user-data')
  @UseGuards(JwtAuthGuard)
  async syncUserData(
    @CurrentUser() user: any,
    @Body() syncUserDataDto: SyncUserDataDto
  ): Promise<SyncUserDataResponseDto> {
    return this.authService.syncUserData(user.id, syncUserDataDto);
  }
}
