import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { 
  CreatePolicyDto, 
  UpdatePolicyDto, 
  PolicyDto, 
  PolicyStatus,
  PolicyResponseDto,
  PolicyCreateResponseDto,
  PolicyVersionResponseDto,
  PolicyStatusResponseDto,
  PolicyDeleteResponseDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('policies')
@ApiBearerAuth()
@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  /**
   * Obtiene todas las políticas activas
   * @param companyId ID de la compañía para filtrar políticas
   * @returns Lista de políticas
   */
  @Get()
  @ApiOperation({ summary: 'Obtiene todas las políticas legales activas' })
  @ApiResponse({ status: 200, description: 'Lista de políticas obtenida', type: [PolicyDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiQuery({ name: 'companyId', required: false, description: 'ID de la compañía para filtrar' })
  async findAll(@Query('companyId') companyId?: string): Promise<PolicyDto[]> {
    return this.policiesService.findAll(companyId);
  }

  /**
   * Crea una nueva política
   * @param createPolicyDto Datos para crear la política
   * @param userId ID del usuario autenticado
   * @returns Política creada
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crea una nueva política legal' })
  @ApiResponse({ status: 201, description: 'Política creada exitosamente', type: PolicyCreateResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async create(
    @Body() createPolicyDto: CreatePolicyDto,
    @CurrentUser('id') userId: string,
  ): Promise<PolicyCreateResponseDto> {
    const policy = await this.policiesService.create(createPolicyDto, userId);
    return {
      message: 'Política legal creada exitosamente',
      id: policy.id,
      version: policy.version ?? 1,
      validFrom: policy.validFrom
    };
  }

  /**
   * Obtiene una política por su ID
   * @param id ID de la política
   * @returns Política encontrada
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una política legal por su ID' })
  @ApiResponse({ status: 200, description: 'Política encontrada', type: PolicyDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Política no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID de la política' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PolicyDto> {
    return this.policiesService.findOne(id);
  }

  /**
   * Actualiza una política (crea una nueva versión)
   * @param id ID de la política
   * @param updatePolicyDto Datos para actualizar la política
   * @param userId ID del usuario autenticado
   * @returns Nueva versión de la política
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualiza una política legal (crea nueva versión)' })
  @ApiResponse({ status: 200, description: 'Nueva versión creada exitosamente', type: PolicyVersionResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Política no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID de la política a actualizar' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @CurrentUser('id') userId: string,
  ): Promise<PolicyVersionResponseDto> {
    const newVersion = await this.policiesService.update(id, updatePolicyDto, userId);
    return {
      message: 'Nueva versión de política creada exitosamente',
      id: newVersion.id,
      previousVersionId: newVersion.previousVersionId ?? '',
      version: newVersion.version ?? 1
    };
  }

  /**
   * Obtiene todas las versiones de una política
   * @param id ID de la política
   * @returns Lista de versiones de la política
   */
  @Get(':id/versions')
  @ApiOperation({ summary: 'Obtiene todas las versiones de una política' })
  @ApiResponse({ status: 200, description: 'Versiones encontradas', type: [PolicyDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Política no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID de la política' })
  async findVersions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PolicyDto[]> {
    return this.policiesService.findVersions(id);
  }

  /**
   * Cambia el estado de una política
   * @param id ID de la política
   * @param status Nuevo estado
   * @param userId ID del usuario autenticado
   * @returns Respuesta con información de la actualización
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cambia el estado de una política' })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente', type: PolicyStatusResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o transición no permitida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Política no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID de la política' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PolicyStatus,
    @CurrentUser('id') userId: string,
  ): Promise<PolicyStatusResponseDto> {
    const policy = await this.policiesService.findOne(id);
    const previousStatus = policy.status || PolicyStatus.DRAFT;
    const updatedPolicy = await this.policiesService.updateStatus(id, status, userId);
    
    return {
      message: 'Estado de política actualizado correctamente',
      id: updatedPolicy.id,
      previousStatus: previousStatus,
      currentStatus: updatedPolicy.status || PolicyStatus.DRAFT
    };
  }

  /**
   * Elimina una política (soft delete)
   * @param id ID de la política
   * @param userId ID del usuario autenticado
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Elimina una política (soft delete)' })
  @ApiResponse({ status: 200, description: 'Política eliminada correctamente', type: PolicyDeleteResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Política no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID de la política' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PolicyDeleteResponseDto> {
    await this.policiesService.remove(id, userId);
    return {
      message: 'Política eliminada correctamente',
      id
    };
  }
}
