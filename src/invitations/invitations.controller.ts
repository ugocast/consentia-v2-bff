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
  BadRequestException,
  ParseUUIDPipe,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { 
  CreateInvitationDto, 
  InvitationDto, 
  AcceptInvitationDto 
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCompanyContext } from '../common/decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';
import { InvitationStatus } from './enums/invitation-status.enum';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * Crea una nueva invitación
   */
  @ApiOperation({ summary: 'Crea una nueva invitación' })
  @ApiResponse({ status: 201, description: 'Invitación creada exitosamente', type: InvitationDto })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @RequireCompanyContext()
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
    @CurrentUser() user: any,
    @Req() req: RequestWithCompanyContext
  ): Promise<InvitationDto> {
    // Verificar que la compañía en el DTO coincide con el contexto
    if (createInvitationDto.companyId !== req.companyContext?.companyId) {
      throw new BadRequestException('La compañía en el DTO debe coincidir con el contexto de compañía');
    }
    
    return this.invitationsService.create(createInvitationDto, user.id);
  }

  /**
   * Obtiene todas las invitaciones de una compañía
   */
  @ApiOperation({ summary: 'Obtiene todas las invitaciones de una compañía' })
  @ApiResponse({ status: 200, description: 'Lista de invitaciones', type: [InvitationDto] })
  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @RequireCompanyContext({ requireInParams: true })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('status') status?: InvitationStatus
  ): Promise<InvitationDto[]> {
    return this.invitationsService.findAll(companyId, status);
  }

  /**
   * Obtiene una invitación por su ID
   */
  @ApiOperation({ summary: 'Obtiene una invitación por su ID' })
  @ApiResponse({ status: 200, description: 'Invitación encontrada', type: InvitationDto })
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<InvitationDto> {
    return this.invitationsService.findOne(id);
  }

  /**
   * Verifica la validez de un token de invitación (endpoint público)
   */
  @ApiOperation({ summary: 'Verifica la validez de un token de invitación' })
  @ApiResponse({ status: 200, description: 'Información de la invitación', type: InvitationDto })
  @Get('verify/:token')
  async verifyToken(
    @Param('token') token: string
  ): Promise<InvitationDto> {
    return this.invitationsService.findByToken(token);
  }

  /**
   * Acepta una invitación (endpoint público)
   */
  @ApiOperation({ summary: 'Acepta una invitación' })
  @ApiResponse({ status: 200, description: 'Invitación aceptada', type: InvitationDto })
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Body() acceptInvitationDto: AcceptInvitationDto
  ): Promise<InvitationDto> {
    return this.invitationsService.accept(acceptInvitationDto);
  }

  /**
   * Cancela una invitación
   */
  @ApiOperation({ summary: 'Cancela una invitación' })
  @ApiResponse({ status: 200, description: 'Invitación cancelada', type: InvitationDto })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<InvitationDto> {
    return this.invitationsService.cancel(id);
  }

  /**
   * Regenera el token de una invitación
   */
  @ApiOperation({ summary: 'Regenera el token de una invitación' })
  @ApiResponse({ status: 200, description: 'Token regenerado', type: InvitationDto })
  @Put(':id/regenerate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async regenerateToken(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<InvitationDto> {
    return this.invitationsService.regenerateToken(id);
  }
} 