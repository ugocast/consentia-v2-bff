import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConsentsService } from './consents.service';
import {
  CreateConsentRequestDto,
  RespondConsentRequestDto,
  UpdateConsentStatusDto,
  ConsentDto,
  ConsentRequestDto,
  ConsentWithDetailsDto,
  ConsentStatus,
  ConsentResponseDto,
  ConsentStatusResponseDto,
  ConsentRequestResponseDto,
  ConsentRequestAnswerResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RequireCompanyContext, SkipCompanyContext } from '../common/decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';

@ApiTags('consents')
@ApiBearerAuth()
@Controller('consents')
@UseGuards(JwtAuthGuard)
@RequireCompanyContext()
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  /**
   * Obtiene todos los consentimientos con filtros opcionales
   * @param companyId ID de la compañía para filtrar consentimientos
   * @param dataSubjectId ID del titular de los datos para filtrar consentimientos
   * @param status Estado para filtrar consentimientos
   * @returns Lista de consentimientos
   */
  @Get()
  @ApiOperation({ summary: 'Obtiene todos los consentimientos con filtros opcionales' })
  @ApiResponse({ status: 200, description: 'Lista de consentimientos obtenida', type: [ConsentDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiQuery({ name: 'companyId', required: false, description: 'ID de la compañía' })
  @ApiQuery({ name: 'dataSubjectId', required: false, description: 'ID del titular de datos' })
  @ApiQuery({ name: 'status', required: false, enum: ConsentStatus, description: 'Estado del consentimiento' })
  async findAll(
    @Req() req: RequestWithCompanyContext,
    @Query('companyId') companyId?: string,
    @Query('dataSubjectId') dataSubjectId?: string,
    @Query('status') status?: ConsentStatus,
  ): Promise<ConsentDto[]> {
    if (!companyId && req.companyContext) {
      companyId = req.companyContext.companyId;
    }
    return this.consentsService.findAll(companyId, dataSubjectId, status);
  }

  /**
   * Obtiene un consentimiento por su ID con detalles adicionales
   * @param id ID del consentimiento
   * @returns Consentimiento con detalles
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un consentimiento por su ID con detalles adicionales' })
  @ApiResponse({ status: 200, description: 'Consentimiento obtenido', type: ConsentWithDetailsDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Consentimiento no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID del consentimiento' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConsentWithDetailsDto> {
    return this.consentsService.findOne(id);
  }

  /**
   * Actualiza el estado de un consentimiento
   * @param id ID del consentimiento
   * @param updateStatusDto Datos para actualizar el estado
   * @param userId ID del usuario autenticado
   * @returns Consentimiento actualizado
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualiza el estado de un consentimiento' })
  @ApiResponse({ status: 200, description: 'Estado actualizado', type: ConsentStatusResponseDto })
  @ApiResponse({ status: 400, description: 'Solicitud inválida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Consentimiento no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID del consentimiento' })
  @RequireCompanyContext({ requireRoles: [UserRole.ADMIN, UserRole.MANAGER] })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateConsentStatusDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsentStatusResponseDto> {
    const oldConsent = await this.consentsService.findOne(id);
    const result = await this.consentsService.updateStatus(id, updateStatusDto, userId);
    return {
      message: 'Estado del consentimiento actualizado correctamente',
      id: result.id,
      previousStatus: oldConsent.status as ConsentStatus,
      currentStatus: result.status as ConsentStatus,
      updatedAt: result.updatedAt
    };
  }

  /**
   * Crea una nueva solicitud de consentimiento
   * @param createRequestDto Datos para crear la solicitud
   * @param userId ID del usuario autenticado
   * @returns Solicitud de consentimiento creada
   */
  @Post('requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crea una nueva solicitud de consentimiento' })
  @ApiResponse({ status: 201, description: 'Solicitud creada', type: ConsentRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @RequireCompanyContext({ requireRoles: [UserRole.ADMIN, UserRole.MANAGER] })
  async createRequest(
    @Body() createRequestDto: CreateConsentRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsentRequestResponseDto> {
    const result = await this.consentsService.createRequest(createRequestDto, userId);
    return {
      message: 'Solicitud de consentimiento creada correctamente',
      requestId: result.id,
      responseUrl: `${process.env.APP_BASE_URL || 'https://app.consentia.io'}/consents/respond/${result.id}`,
      expiresAt: result.expiresAt
    };
  }

  /**
   * Obtiene una solicitud de consentimiento por su ID
   * @param id ID de la solicitud
   * @returns Solicitud de consentimiento
   */
  @Get('requests/:id')
  @ApiOperation({ summary: 'Obtiene una solicitud de consentimiento por su ID' })
  @ApiResponse({ status: 200, description: 'Solicitud obtenida', type: ConsentRequestDto })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de consentimiento' })
  @RequireCompanyContext()
  async findRequest(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConsentRequestDto> {
    return this.consentsService.findRequest(id);
  }

  /**
   * Responde a una solicitud de consentimiento
   * @param id ID de la solicitud
   * @param respondDto Datos para responder a la solicitud
   * @param req Objeto de solicitud HTTP
   * @returns Consentimiento creado
   */
  @Post('requests/:id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Responde a una solicitud de consentimiento' })
  @ApiResponse({ status: 200, description: 'Respuesta registrada', type: ConsentRequestAnswerResponseDto })
  @ApiResponse({ status: 400, description: 'Solicitud inválida o expirada' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de consentimiento' })
  @SkipCompanyContext()
  async respondToRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() respondDto: RespondConsentRequestDto,
    @Req() req: RequestWithCompanyContext,
  ): Promise<ConsentRequestAnswerResponseDto> {
    const ipAddress = req.ip || (req.socket?.remoteAddress as string) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.consentsService.respondToRequest(
      id,
      respondDto,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Respuesta a solicitud de consentimiento registrada correctamente',
      consentId: result.id,
      decision: result.status as ConsentStatus,
      respondedAt: result.createdAt
    };
  }
}
