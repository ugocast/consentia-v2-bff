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
  Delete,
  Put,
  BadRequestException,
  Logger,
  Injectable,
  NotFoundException,
  SetMetadata,
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
  RevokeConsentDto,
  ConsentResponse,
  ConsentHistoryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { RequireCompanyContext, SkipCompanyContext } from '../common/decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';
import { PoliciesService } from '../policies/policies.service';

// Decorador para rutas públicas
const IS_PUBLIC_KEY = 'isPublic';
const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('consents')
@ApiBearerAuth()
@Controller('consents')
@UseGuards(JwtAuthGuard)
@RequireCompanyContext()
export class ConsentsController {
  private readonly logger = new Logger(ConsentsController.name);

  constructor(
    private readonly consentsService: ConsentsService,
    private readonly policiesService: PoliciesService,
  ) {}

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
    @Req() req: RequestWithCompanyContext,
  ): Promise<ConsentRequestResponseDto> {
    const companyId = req.companyContext?.companyId;
    if (!companyId) {
      throw new Error('ID de compañía no encontrado en el contexto');
    }

    // Si no se proporciona un ID de política legal, intentar usar la política activa de la empresa
    if (!createRequestDto.legalPolicyId) {
      try {
        // Obtener la política activa
        const activePolicy = await this.policiesService.getActivePolicy(companyId);
        
        if (activePolicy) {
          createRequestDto.legalPolicyId = activePolicy.id;
          this.logger.log(`Usando política activa de la empresa: ${activePolicy.id}`);
        } else {
          throw new BadRequestException('No se encontró una política activa para la empresa y no se especificó un ID de política');
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        this.logger.error(`Error al obtener política activa: ${error.message}`, error);
        throw new BadRequestException('Se requiere un ID de política legal válido');
      }
    }
    
    const result = await this.consentsService.createRequest(createRequestDto, companyId, userId);
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

  @Get('public/:token')
  @Public()
  @SkipCompanyContext()
  @ApiOperation({ summary: 'Obtener detalles de solicitud de consentimiento por token' })
  @ApiResponse({ status: 200, description: 'Detalles de solicitud', type: ConsentWithDetailsDto })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @ApiResponse({ status: 410, description: 'Solicitud expirada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'token', description: 'Token único de la solicitud' })
  async getConsentDetailsByToken(
    @Param('token') token: string,
    @Req() req: any
  ): Promise<ConsentWithDetailsDto> {
    // Capturar información para auditoría
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    
    return this.consentsService.getConsentDetailsByToken(token, ipAddress, userAgent);
  }

  @Post('public/:token/respond')
  @Public()
  @SkipCompanyContext()
  @ApiOperation({ summary: 'Responder a solicitud de consentimiento' })
  @ApiResponse({ status: 200, description: 'Respuesta registrada exitosamente', type: ConsentResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @ApiResponse({ status: 410, description: 'Solicitud expirada' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'token', description: 'Token único de la solicitud' })
  async respondToConsent(
    @Param('token') token: string,
    @Body() responseDto: RespondConsentRequestDto,
    @Req() req: any
  ): Promise<ConsentResponseDto> {
    // Capturar información para auditoría
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    
    const status = responseDto.response === ConsentResponse.GRANTED 
      ? ConsentStatus.GRANTED 
      : ConsentStatus.DENIED;
    
    const result = await this.consentsService.respondToConsent(
      token, 
      status, 
      responseDto.reason,
      ipAddress,
      userAgent
    );
    
    return {
      success: true,
      message: status === ConsentStatus.GRANTED
        ? 'Consentimiento otorgado exitosamente'
        : 'Consentimiento rechazado exitosamente',
      consentId: result.id,
      status: result.status
    };
  }

  @Post(':id/revoke')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Revocar consentimiento' })
  @ApiResponse({ status: 200, description: 'Consentimiento revocado exitosamente', type: ConsentResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o consentimiento no revocable' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Consentimiento no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'id', description: 'ID del consentimiento' })
  async revokeConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() revokeDto: RevokeConsentDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsentResponseDto> {
    const result = await this.consentsService.revokeConsent(
      id,
      revokeDto.reason,
      userId
    );
    
    return {
      success: true,
      message: 'Consentimiento revocado exitosamente',
      consentId: result.id,
      status: result.status
    };
  }

  /**
   * PORTAL DE USUARIO FINAL (ME ENDPOINTS)
   */

  /**
   * Obtiene el historial de consentimientos del usuario autenticado
   * @returns Lista de consentimientos del usuario autenticado
   */
  @Get('me')
  @Public()
  @SkipCompanyContext()
  @ApiOperation({ summary: 'Obtiene los consentimientos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Consentimientos obtenidos exitosamente', type: [ConsentDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getMyConsents(
    @CurrentUser('dataSubjectId') dataSubjectId: string,
  ): Promise<ConsentDto[]> {
    if (!dataSubjectId) {
      throw new BadRequestException('Esta ruta solo está disponible para titulares de datos autenticados');
    }
    
    return this.consentsService.findAll(undefined, dataSubjectId);
  }

  /**
   * Revoca un consentimiento específico del usuario autenticado
   * @param id ID del consentimiento a revocar
   * @param revokeDto Datos para la revocación
   * @returns Respuesta con estado del consentimiento revocado
   */
  @Post('me/:id/revoke')
  @Public()
  @SkipCompanyContext()
  @ApiOperation({ summary: 'Revoca un consentimiento específico del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Consentimiento revocado exitosamente', type: ConsentResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o consentimiento no revocable' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Consentimiento no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async revokeMyConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() revokeDto: RevokeConsentDto,
    @CurrentUser('dataSubjectId') dataSubjectId: string,
  ): Promise<ConsentResponseDto> {
    if (!dataSubjectId) {
      throw new BadRequestException('Esta ruta solo está disponible para titulares de datos autenticados');
    }
    
    // Verificar que el consentimiento pertenezca al usuario autenticado
    const consent = await this.consentsService.findOne(id);
    if (consent.dataSubject?.id !== dataSubjectId) {
      throw new BadRequestException('No tiene permisos para revocar este consentimiento');
    }
    
    // Revocar el consentimiento
    const result = await this.consentsService.revokeConsent(
      id,
      revokeDto.reason,
      null // null indica que es el propio titular quien revoca
    );
    
    return {
      success: true,
      message: 'Consentimiento revocado exitosamente',
      consentId: result.id,
      status: result.status
    };
  }

  /**
   * Obtiene el historial de consentimientos de un titular de datos específico
   * @param dataSubjectId ID del titular de datos
   * @returns Historia de consentimientos con detalles
   */
  @Get('history/:dataSubjectId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Obtiene historial de consentimientos de un titular de datos' })
  @ApiResponse({ status: 200, description: 'Historial de consentimientos obtenido', type: [ConsentHistoryDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Titular de datos no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @ApiParam({ name: 'dataSubjectId', description: 'ID del titular de datos' })
  async getConsentHistory(
    @Param('dataSubjectId', ParseUUIDPipe) dataSubjectId: string,
  ): Promise<ConsentHistoryDto[]> {
    return this.consentsService.getConsentHistory(dataSubjectId);
  }

  /**
   * Obtiene el historial de consentimientos del usuario autenticado como titular de datos
   * @returns Historia de consentimientos del titular de datos autenticado
   */
  @Get('me/history')
  @Public()
  @SkipCompanyContext()
  @ApiOperation({ summary: 'Obtiene historial de consentimientos del usuario autenticado como titular de datos' })
  @ApiResponse({ status: 200, description: 'Historial de consentimientos obtenido', type: [ConsentHistoryDto] })
  @ApiResponse({ status: 400, description: 'Usuario no es un titular de datos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getMyConsentHistory(
    @CurrentUser('dataSubjectId') dataSubjectId: string,
  ): Promise<ConsentHistoryDto[]> {
    if (!dataSubjectId) {
      throw new BadRequestException('Esta ruta solo está disponible para titulares de datos autenticados');
    }
    
    return this.consentsService.getConsentHistory(dataSubjectId);
  }
}
