import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DataSubjectsService } from './data-subjects.service';
import {
  CreateDataSubjectDto,
  UpdateDataSubjectDto,
  DataSubjectDto,
  DataSubjectStatus,
  PortalAccessRequestDto,
  PortalVerificationDto,
  ConsentHistoryDto,
  ConsentPreferencesDto,
  DataDeletionRequestDto,
  DataAccessRequestDto,
  DataAccessResponseDto,
  DataRectificationRequestDto,
  PortalAccessResponseDto,
  PortalVerificationResponseDto,
  ArcoRequestResponseDto,
  DeleteResponseDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('data-subjects')
@ApiBearerAuth()
@Controller('data-subjects')
@UseGuards(JwtAuthGuard)
export class DataSubjectsController {
  constructor(private readonly dataSubjectsService: DataSubjectsService) {}

  /**
   * Crea un nuevo titular de datos
   * @param createDataSubjectDto Datos para crear el titular
   * @param userId ID del usuario autenticado
   * @returns Titular de datos creado
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crea un nuevo titular de datos' })
  @ApiResponse({ status: 201, description: 'Titular creado exitosamente', type: DataSubjectDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  async create(
    @Body() createDataSubjectDto: CreateDataSubjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<DataSubjectDto> {
    return this.dataSubjectsService.create(createDataSubjectDto, userId);
  }

  /**
   * Obtiene todos los titulares de datos con filtros opcionales
   * @param companyId ID de la compañía (opcional)
   * @param status Estado del titular (opcional)
   * @returns Lista de titulares de datos
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Obtiene todos los titulares de datos' })
  @ApiResponse({ status: 200, description: 'Lista de titulares obtenida', type: [DataSubjectDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('status') status?: DataSubjectStatus,
  ): Promise<DataSubjectDto[]> {
    return this.dataSubjectsService.findAll(companyId, status);
  }

  /**
   * Obtiene un titular de datos por su ID
   * @param id ID del titular de datos
   * @returns Titular de datos
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Obtiene un titular de datos por su ID' })
  @ApiResponse({ status: 200, description: 'Titular encontrado', type: DataSubjectDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DataSubjectDto> {
    return this.dataSubjectsService.findOne(id);
  }

  /**
   * Busca un titular de datos por su email
   * @param email Email del titular de datos
   * @returns Titular de datos
   */
  @Get('by-email/:email')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Obtiene un titular de datos por su email' })
  @ApiResponse({ status: 200, description: 'Titular encontrado', type: DataSubjectDto })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async findByEmail(@Param('email') email: string): Promise<DataSubjectDto> {
    if (!email) {
      throw new BadRequestException('El email es requerido');
    }
    return this.dataSubjectsService.findByEmail(email);
  }

  /**
   * Actualiza un titular de datos
   * @param id ID del titular de datos
   * @param updateDataSubjectDto Datos para actualizar
   * @param userId ID del usuario autenticado
   * @returns Titular de datos actualizado
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualiza un titular de datos' })
  @ApiResponse({ status: 200, description: 'Titular actualizado', type: DataSubjectDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDataSubjectDto: UpdateDataSubjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<DataSubjectDto> {
    return this.dataSubjectsService.update(id, updateDataSubjectDto, userId);
  }

  /**
   * Elimina un titular de datos (cambio de estado a DELETED)
   * @param id ID del titular de datos
   * @param userId ID del usuario autenticado
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Elimina un titular de datos (cambio a estado DELETED)' })
  @ApiResponse({ status: 200, description: 'Titular eliminado', type: DeleteResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DeleteResponseDto> {
    await this.dataSubjectsService.remove(id, userId);
    return {
      message: 'El titular de datos ha sido eliminado correctamente',
      id
    };
  }

  /**
   * PORTAL DE AUTOGESTIÓN
   */

  /**
   * Solicita acceso al portal de autogestión
   * @param portalAccessRequestDto Datos para solicitar acceso
   * @returns Mensaje de confirmación
   */
  @Post('portal/request-access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita acceso al portal de autogestión' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada', type: PortalAccessResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Email no encontrado' })
  async requestPortalAccess(
    @Body() portalAccessRequestDto: PortalAccessRequestDto,
  ): Promise<PortalAccessResponseDto> {
    return this.dataSubjectsService.requestPortalAccess(portalAccessRequestDto);
  }

  /**
   * Verifica token de acceso al portal
   * @param portalVerificationDto Datos para verificar el token
   * @returns ID del titular de datos
   */
  @Post('portal/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica un token de acceso al portal' })
  @ApiResponse({ status: 200, description: 'Token verificado', type: PortalVerificationResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async verifyPortalAccess(
    @Body() portalVerificationDto: PortalVerificationDto,
  ): Promise<PortalVerificationResponseDto> {
    return this.dataSubjectsService.verifyPortalAccess(portalVerificationDto);
  }

  /**
   * Obtiene el historial de consentimientos de un titular de datos
   * @param dataSubjectId ID del titular de datos
   * @returns Historial de consentimientos
   */
  @Get('portal/:dataSubjectId/consent-history')
  @ApiOperation({ summary: 'Obtiene historial de consentimientos de un titular' })
  @ApiResponse({ status: 200, description: 'Historial obtenido', type: [ConsentHistoryDto] })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async getConsentHistory(
    @Param('dataSubjectId', ParseUUIDPipe) dataSubjectId: string,
  ): Promise<ConsentHistoryDto[]> {
    return this.dataSubjectsService.getConsentHistory(dataSubjectId);
  }

  /**
   * Obtiene las preferencias de consentimiento actuales
   * @param dataSubjectId ID del titular de datos
   * @returns Preferencias de consentimiento
   */
  @Get('portal/:dataSubjectId/consent-preferences')
  @ApiOperation({ summary: 'Obtiene preferencias de consentimiento actuales' })
  @ApiResponse({ status: 200, description: 'Preferencias obtenidas', type: ConsentPreferencesDto })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async getConsentPreferences(
    @Param('dataSubjectId', ParseUUIDPipe) dataSubjectId: string,
  ): Promise<ConsentPreferencesDto> {
    return this.dataSubjectsService.getConsentPreferences(dataSubjectId);
  }

  /**
   * DERECHOS ARCO (Acceso, Rectificación, Cancelación, Oposición)
   */

  /**
   * Solicita la eliminación de datos personales
   * @param dataSubjectId ID del titular de datos
   * @param dataDeletionRequestDto Datos para la solicitud de eliminación
   * @returns Mensaje de confirmación con ID de la solicitud
   */
  @Post('portal/:dataSubjectId/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita eliminación de datos personales' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada', type: ArcoRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async requestDataDeletion(
    @Param('dataSubjectId', ParseUUIDPipe) dataSubjectId: string,
    @Body() dataDeletionRequestDto: DataDeletionRequestDto,
  ): Promise<ArcoRequestResponseDto> {
    return this.dataSubjectsService.requestDataDeletion(
      dataSubjectId,
      dataDeletionRequestDto,
    );
  }

  /**
   * Solicita acceso a datos personales
   * @param dataSubjectId ID del titular de datos
   * @param dataAccessRequestDto Datos para la solicitud de acceso
   * @returns Respuesta con los datos personales
   */
  @Post('portal/:dataSubjectId/access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita acceso a datos personales' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos', type: DataAccessResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async requestDataAccess(
    @Param('dataSubjectId', ParseUUIDPipe) dataSubjectId: string,
    @Body() dataAccessRequestDto: DataAccessRequestDto,
  ): Promise<DataAccessResponseDto> {
    return this.dataSubjectsService.requestDataAccess(
      dataSubjectId,
      dataAccessRequestDto,
    );
  }

  /**
   * Solicita la rectificación de datos personales
   * @param dataSubjectId ID del titular de datos
   * @param dataRectificationRequestDto Datos para la solicitud de rectificación
   * @returns Mensaje de confirmación con ID de la solicitud
   */
  @Post('portal/:dataSubjectId/rectify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita rectificación de datos personales' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada', type: ArcoRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Titular no encontrado' })
  async requestDataRectification(
    @Param('dataSubjectId', ParseUUIDPipe) dataSubjectId: string,
    @Body() dataRectificationRequestDto: DataRectificationRequestDto,
  ): Promise<ArcoRequestResponseDto> {
    return this.dataSubjectsService.requestDataRectification(
      dataSubjectId,
      dataRectificationRequestDto,
    );
  }
}
