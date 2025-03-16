import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService, AuditAction, ResourceType } from './audit.service';
import { JwtGuard } from '../../auth/jwt/jwt.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Obtener logs de auditoría' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'resourceType', required: false, enum: ResourceType })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Logs de auditoría obtenidos correctamente' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('resourceType') resourceType?: ResourceType,
    @Query('resourceId') resourceId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    const filters = {
      userId,
      resourceType,
      resourceId,
      action,
      startDate,
      endDate,
    };

    return this.auditService.getAuditLogs(
      filters,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }
} 