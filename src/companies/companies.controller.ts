import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyConfigDto,
  SubscriptionPlanDto,
  Company,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCompanyContext, SkipCompanyContext } from '../common/decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Obtiene todas las empresas
   * @returns Lista de empresas
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({
    status: 200,
    description: 'List of companies',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SkipCompanyContext() // Para administradores globales, no requiere contexto de empresa
  async findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  /**
   * Obtiene una empresa por su ID
   * @param id ID de la empresa
   * @returns Empresa encontrada
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found company',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @RequireCompanyContext({ requireInParams: true })
  async findOne(
    @Param('id') id: string,
  ): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  /**
   * Crea una nueva empresa
   * @param createCompanyDto Datos para crear la empresa
   * @param user Usuario autenticado
   * @returns Empresa creada
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: 201,
    description: 'The company has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SkipCompanyContext() // Creación de nueva empresa, no requiere contexto
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser('id') userId: string,
  ): Promise<Company> {
    return this.companiesService.create(createCompanyDto, userId);
  }

  /**
   * Actualiza una empresa
   * @param id ID de la empresa
   * @param updateCompanyDto Datos para actualizar la empresa
   * @param user Usuario autenticado
   * @returns Empresa actualizada
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a company' })
  @ApiResponse({
    status: 200,
    description: 'The company has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser('id') userId: string,
  ): Promise<Company> {
    return this.companiesService.update(id, updateCompanyDto, userId);
  }

  /**
   * Actualiza la configuración de una empresa
   * @param id ID de la empresa
   * @param configDto Datos de configuración
   * @param user Usuario autenticado
   * @returns Empresa actualizada
   */
  @Get(':id/config')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get company configuration' })
  @ApiResponse({
    status: 200,
    description: 'The company configuration',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getConfig(
    @Param('id') id: string,
  ): Promise<CompanyConfigDto> {
    return this.companiesService.getConfig(id);
  }

  /**
   * Actualiza la configuración de una empresa
   * @param id ID de la empresa
   * @param configDto Datos de configuración
   * @param user Usuario autenticado
   * @returns Empresa actualizada
   */
  @Patch(':id/config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update company configuration' })
  @ApiResponse({
    status: 200,
    description: 'The company configuration has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateConfig(
    @Param('id') id: string,
    @Body() configDto: CompanyConfigDto,
    @CurrentUser('id') userId: string,
  ): Promise<Company> {
    return this.companiesService.updateConfig(id, configDto, userId);
  }

  /**
   * Actualiza el plan de suscripción de una empresa
   * @param id ID de la empresa
   * @param subscriptionDto Datos de suscripción
   * @param user Usuario autenticado
   * @returns Empresa actualizada
   */
  @Get(':id/subscription')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get company subscription' })
  @ApiResponse({
    status: 200,
    description: 'The company subscription',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getSubscription(
    @Param('id') id: string,
  ): Promise<SubscriptionPlanDto> {
    return this.companiesService.getSubscription(id);
  }

  @Patch(':id/subscription')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update company subscription' })
  @ApiResponse({
    status: 200,
    description: 'The company subscription has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() subscriptionDto: SubscriptionPlanDto,
    @CurrentUser('id') userId: string,
  ): Promise<Company> {
    return this.companiesService.updateSubscription(id, subscriptionDto, userId);
  }
}
