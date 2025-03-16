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
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { Request } from 'express';

@Controller('consents')
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  /**
   * Obtiene todos los consentimientos con filtros opcionales
   * @param companyId ID de la compañía para filtrar consentimientos
   * @param dataSubjectId ID del titular de los datos para filtrar consentimientos
   * @param status Estado para filtrar consentimientos
   * @returns Lista de consentimientos
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('dataSubjectId') dataSubjectId?: string,
    @Query('status') status?: ConsentStatus,
  ): Promise<ConsentDto[]> {
    return this.consentsService.findAll(companyId, dataSubjectId, status);
  }

  /**
   * Obtiene un consentimiento por su ID con detalles adicionales
   * @param id ID del consentimiento
   * @returns Consentimiento con detalles
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConsentWithDetailsDto> {
    return this.consentsService.findOne(id);
  }

  /**
   * Actualiza el estado de un consentimiento
   * @param id ID del consentimiento
   * @param updateStatusDto Datos para actualizar el estado
   * @param user Usuario autenticado
   * @returns Consentimiento actualizado
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateConsentStatusDto,
    @CurrentUser() user: any,
  ): Promise<ConsentDto> {
    return this.consentsService.updateStatus(id, updateStatusDto, user.id);
  }

  /**
   * Crea una nueva solicitud de consentimiento
   * @param createRequestDto Datos para crear la solicitud
   * @param user Usuario autenticado
   * @returns Solicitud de consentimiento creada
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('requests')
  async createRequest(
    @Body() createRequestDto: CreateConsentRequestDto,
    @CurrentUser() user: any,
  ): Promise<ConsentRequestDto> {
    return this.consentsService.createRequest(createRequestDto, user.id);
  }

  /**
   * Obtiene una solicitud de consentimiento por su ID
   * @param id ID de la solicitud
   * @returns Solicitud de consentimiento
   */
  @Get('requests/:id')
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
  async respondToRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() respondDto: RespondConsentRequestDto,
    @Req() req: Request,
  ): Promise<ConsentDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.consentsService.respondToRequest(
      id,
      respondDto,
      ipAddress,
      userAgent,
    );
  }
}
