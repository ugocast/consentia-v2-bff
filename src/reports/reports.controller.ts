import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ReportsService } from './reports.service';
import {
  ConsentReportQueryDto,
  ConsentReportResultDto,
  AuditReportQueryDto,
  AuditReportResultDto,
  MetricsQueryDto,
  MetricsResultDto,
} from './dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('consents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generar reporte de consentimientos' })
  @ApiResponse({
    status: 200,
    description: 'Reporte de consentimientos generado exitosamente',
    type: ConsentReportResultDto,
  })
  async generateConsentReport(@Query() queryDto: ConsentReportQueryDto): Promise<ConsentReportResultDto> {
    return this.reportsService.generateConsentReport(queryDto);
  }

  @Get('audit')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generar reporte de auditoría' })
  @ApiResponse({
    status: 200,
    description: 'Reporte de auditoría generado exitosamente',
    type: AuditReportResultDto,
  })
  async generateAuditReport(@Query() queryDto: AuditReportQueryDto): Promise<AuditReportResultDto> {
    return this.reportsService.generateAuditReport(queryDto);
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generar métricas y KPIs' })
  @ApiResponse({
    status: 200,
    description: 'Métricas generadas exitosamente',
    type: MetricsResultDto,
  })
  async generateMetrics(@Query() queryDto: MetricsQueryDto): Promise<MetricsResultDto> {
    return this.reportsService.generateMetrics(queryDto);
  }
}
