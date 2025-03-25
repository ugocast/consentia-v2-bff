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
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BulkOperationsService } from './bulk-operations.service';
import { CreateBulkOperationDto, ProcessBulkOperationDto, UpdateBulkOperationDto, BulkOperationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Controlador para gestionar operaciones masivas
 * Permite crear, procesar, actualizar y eliminar operaciones masivas
 * Solo accesible para usuarios con rol ADMIN
 */
@ApiTags('bulk-operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies/:companyId/bulk-operations')
export class BulkOperationsController {
  constructor(private readonly bulkOperationsService: BulkOperationsService) {}

  /**
   * Crea una nueva operación masiva
   * @param companyId - ID de la compañía asociada a la operación
   * @param createBulkOperationDto - DTO con los datos para crear la operación
   * @param userId - ID del usuario que realiza la operación
   * @returns Operación masiva creada
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new bulk operation' })
  @ApiResponse({
    status: 201,
    description: 'The bulk operation has been successfully created.',
    type: BulkOperationDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() createBulkOperationDto: CreateBulkOperationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bulkOperationsService.create(companyId, createBulkOperationDto, userId);
  }

  /**
   * Procesa una operación masiva existente
   * @param companyId - ID de la compañía asociada a la operación
   * @param id - ID de la operación a procesar
   * @param processBulkOperationDto - DTO con los datos para procesar la operación
   * @param userId - ID del usuario que realiza la operación
   * @returns Operación masiva procesada
   */
  @Post(':id/process')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Process a bulk operation' })
  @ApiResponse({
    status: 200,
    description: 'The bulk operation has been successfully processed.',
    type: BulkOperationDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bulk operation not found' })
  processBulkOperation(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() processBulkOperationDto: ProcessBulkOperationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bulkOperationsService.processBulkOperation(
      companyId,
      id,
      processBulkOperationDto,
      userId,
    );
  }

  /**
   * Obtiene todas las operaciones masivas de una compañía
   * @param companyId - ID de la compañía asociada a las operaciones
   * @param status - Estado de las operaciones a filtrar
   * @param type - Tipo de las operaciones a filtrar
   * @returns Lista de operaciones masivas
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get all bulk operations' })
  @ApiResponse({
    status: 200,
    description: 'List of bulk operations',
    type: [BulkOperationDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.bulkOperationsService.findAll(companyId, { status, type });
  }

  /**
   * Obtiene una operación masiva por su ID
   * @param companyId - ID de la compañía asociada a la operación
   * @param id - ID de la operación a buscar
   * @returns Operación masiva encontrada
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get a bulk operation by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found bulk operation',
    type: BulkOperationDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bulk operation not found' })
  findOne(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bulkOperationsService.findOne(companyId, id);
  }

  /**
   * Actualiza una operación masiva
   * @param companyId - ID de la compañía asociada a la operación
   * @param id - ID de la operación a actualizar
   * @param updateBulkOperationDto - DTO con los datos para actualizar la operación
   * @param userId - ID del usuario que realiza la operación
   * @returns Operación masiva actualizada
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a bulk operation' })
  @ApiResponse({
    status: 200,
    description: 'The bulk operation has been successfully updated.',
    type: BulkOperationDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bulk operation not found' })
  update(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBulkOperationDto: UpdateBulkOperationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bulkOperationsService.update(
      companyId,
      id,
      updateBulkOperationDto,
      userId,
    );
  }

  /**
   * Actualiza el estado de una operación masiva
   * @param companyId - ID de la compañía asociada a la operación
   * @param id - ID de la operación a actualizar
   * @param status - Nuevo estado de la operación
   * @param userId - ID del usuario que realiza la operación
   * @returns Operación masiva actualizada
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a bulk operation status' })
  @ApiResponse({
    status: 200,
    description: 'The bulk operation status has been successfully updated.',
    type: BulkOperationDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bulk operation not found' })
  updateStatus(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
    @CurrentUser('id') userId: string,
  ) {
    return this.bulkOperationsService.updateStatus(
      companyId,
      id,
      status,
      userId,
    );
  }

  /**
   * Elimina una operación masiva
   * @param companyId - ID de la compañía asociada a la operación
   * @param id - ID de la operación a eliminar
   * @param userId - ID del usuario que realiza la operación
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bulk operation' })
  @ApiResponse({ status: 204, description: 'The bulk operation has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bulk operation not found' })
  remove(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bulkOperationsService.remove(companyId, id, userId);
  }
}
