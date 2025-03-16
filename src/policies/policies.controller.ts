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
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto, UpdatePolicyDto, PolicyDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  /**
   * Obtiene todas las políticas activas
   * @param companyId ID de la compañía para filtrar políticas
   * @returns Lista de políticas
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query('companyId') companyId?: string): Promise<PolicyDto[]> {
    return this.policiesService.findAll(companyId);
  }

  /**
   * Crea una nueva política
   * @param createPolicyDto Datos para crear la política
   * @param user Usuario autenticado
   * @returns Política creada
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async create(
    @Body() createPolicyDto: CreatePolicyDto,
    @CurrentUser() user: any,
  ): Promise<PolicyDto> {
    return this.policiesService.create(createPolicyDto, user.id);
  }

  /**
   * Obtiene una política por su ID
   * @param id ID de la política
   * @returns Política encontrada
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PolicyDto> {
    return this.policiesService.findOne(id);
  }

  /**
   * Actualiza una política (crea una nueva versión)
   * @param id ID de la política
   * @param updatePolicyDto Datos para actualizar la política
   * @param user Usuario autenticado
   * @returns Nueva versión de la política
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @CurrentUser() user: any,
  ): Promise<PolicyDto> {
    return this.policiesService.update(id, updatePolicyDto, user.id);
  }

  /**
   * Obtiene todas las versiones de una política
   * @param id ID de la política
   * @returns Lista de versiones de la política
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/versions')
  async findVersions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PolicyDto[]> {
    return this.policiesService.findVersions(id);
  }

  /**
   * Elimina una política (soft delete)
   * @param id ID de la política
   * @param user Usuario autenticado
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.policiesService.remove(id, user.id);
  }
}
