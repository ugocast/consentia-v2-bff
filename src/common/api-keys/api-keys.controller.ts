import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, Query, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyDto, CreateApiKeyDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RequestWithCompanyContext } from '../interfaces/company-context.interface';

@ApiTags('api-keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Crea una nueva clave API
   * @param createApiKeyDto Datos para crear la clave API
   * @param req Objeto de solicitud
   * @returns La clave API creada
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva clave API' })
  @ApiResponse({
    status: 201,
    description: 'Clave API creada correctamente',
    type: ApiKeyDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createApiKey(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @Req() req: RequestWithCompanyContext,
  ): Promise<ApiKeyDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.apiKeysService.createApiKey(createApiKeyDto, req.user.id);
  }

  /**
   * Obtiene todas las claves API para una empresa
   * @param companyId ID de la empresa
   * @returns Lista de claves API
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las claves API de una empresa' })
  @ApiQuery({
    name: 'companyId',
    required: true,
    description: 'ID de la empresa'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de claves API',
    type: [ApiKeyDto],
  })
  async getApiKeys(
    @Query('companyId') companyId: string,
  ): Promise<ApiKeyDto[]> {
    return this.apiKeysService.getApiKeys(companyId);
  }

  /**
   * Obtiene una clave API por su ID
   * @param id ID de la clave API
   * @param companyId ID de la empresa
   * @returns La clave API encontrada
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una clave API por su ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la clave API'
  })
  @ApiQuery({
    name: 'companyId',
    required: true,
    description: 'ID de la empresa'
  })
  @ApiResponse({
    status: 200,
    description: 'Clave API encontrada',
    type: ApiKeyDto,
  })
  @ApiResponse({ status: 404, description: 'Clave API no encontrada' })
  async getApiKeyById(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
  ): Promise<ApiKeyDto> {
    return this.apiKeysService.getApiKeyById(id, companyId);
  }

  /**
   * Revoca una clave API
   * @param id ID de la clave API
   * @param companyId ID de la empresa
   * @param req Objeto de solicitud
   * @returns La clave API revocada
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Revocar una clave API' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID de la clave API'
  })
  @ApiQuery({
    name: 'companyId',
    required: true,
    description: 'ID de la empresa'
  })
  @ApiResponse({
    status: 200,
    description: 'Clave API revocada correctamente',
    type: ApiKeyDto,
  })
  @ApiResponse({ status: 404, description: 'Clave API no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async revokeApiKey(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Req() req: RequestWithCompanyContext,
  ): Promise<ApiKeyDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.apiKeysService.revokeApiKey(id, companyId, req.user.id);
  }
} 