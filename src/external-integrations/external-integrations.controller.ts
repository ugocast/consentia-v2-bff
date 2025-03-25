import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ExternalIntegrationsService } from './external-integrations.service';
import {
  CreateExternalIntegrationDto,
  UpdateExternalIntegrationDto,
  ExternalIntegrationDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('external-integrations')
@ApiBearerAuth()
@Controller('external-integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExternalIntegrationsController {
  constructor(
    private readonly externalIntegrationsService: ExternalIntegrationsService,
  ) {}

  /**
   * Crea una nueva integración externa
   * @param createExternalIntegrationDto - DTO con los datos para crear la integración
   * @param companyId - ID de la compañía
   * @param userId - ID del usuario autenticado
   * @returns Integración externa creada
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear una nueva integración externa' })
  @ApiResponse({ status: 201, description: 'Integración creada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  create(
    @Body() createExternalIntegrationDto: CreateExternalIntegrationDto,
    @Query('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ExternalIntegrationDto> {
    return this.externalIntegrationsService.create(
      companyId,
      createExternalIntegrationDto,
      userId,
    );
  }

  /**
   * Obtiene todas las integraciones externas de una compañía
   * @param companyId - ID de la compañía
   * @returns Lista de integraciones externas
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Obtener todas las integraciones externas' })
  @ApiResponse({ status: 200, description: 'Lista de integraciones' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  findAll(@Query('companyId') companyId: string): Promise<ExternalIntegrationDto[]> {
    return this.externalIntegrationsService.findAll(companyId);
  }

  /**
   * Obtiene una integración externa por su ID
   * @param id - ID de la integración externa
   * @param companyId - ID de la compañía
   * @returns Integración externa encontrada
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Obtener una integración externa por su ID' })
  @ApiResponse({ status: 200, description: 'Integración encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Integración no encontrada' })
  findOne(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ): Promise<ExternalIntegrationDto> {
    return this.externalIntegrationsService.findOne(companyId, id);
  }

  /**
   * Actualiza una integración externa
   * @param id - ID de la integración externa
   * @param updateExternalIntegrationDto - DTO con los datos para actualizar la integración
   * @param companyId - ID de la compañía
   * @param userId - ID del usuario autenticado
   * @returns Integración externa actualizada
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar una integración externa' })
  @ApiResponse({ status: 200, description: 'Integración actualizada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Integración no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateExternalIntegrationDto: UpdateExternalIntegrationDto,
    @Query('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ExternalIntegrationDto> {
    return this.externalIntegrationsService.update(
      companyId,
      id,
      updateExternalIntegrationDto,
      userId,
    );
  }

  /**
   * Elimina una integración externa
   * @param id - ID de la integración externa
   * @param companyId - ID de la compañía
   * @param userId - ID del usuario autenticado
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar una integración externa' })
  @ApiResponse({ status: 200, description: 'Integración eliminada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Integración no encontrada' })
  remove(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.externalIntegrationsService.remove(companyId, id, userId);
  }
}
