import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
  NotFoundException
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CompanyContextService } from '../services/company-context.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// DTO para cambiar de empresa activa
class SwitchCompanyDto {
  companyId: string;
}

// DTO para respuesta de listado de empresas
class CompanyListItemDto {
  id: string;
  name: string;
  role: string;
  isActive?: boolean;
}

// DTO para respuesta de empresa activa
class ActiveCompanyResponseDto {
  companyId: string;
  companyName: string;
  userRole: string;
}

@ApiTags('Company Context')
@Controller('context')
export class CompanyContextController {
  private readonly logger = new Logger(CompanyContextController.name);

  constructor(private readonly companyContextService: CompanyContextService) {}

  @Post('set-active-company')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Establece la empresa activa para el usuario actual' })
  @ApiResponse({ status: 200, description: 'Empresa activa establecida correctamente' })
  @ApiResponse({ status: 403, description: 'El usuario no pertenece a la empresa especificada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async setActiveCompany(@Req() req, @Body() switchCompanyDto: SwitchCompanyDto): Promise<{ success: boolean }> {
    const userId = req.user.id;
    const { companyId } = switchCompanyDto;

    await this.companyContextService.setActiveCompany(userId, companyId);
    this.logger.debug(`Empresa activa establecida: ${companyId} para usuario ${userId}`);

    return { success: true };
  }

  @Get('active-company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene la empresa activa del usuario actual' })
  @ApiResponse({ 
    status: 200, 
    description: 'Empresa activa del usuario', 
    type: ActiveCompanyResponseDto 
  })
  @ApiResponse({ status: 404, description: 'No se encontró ninguna empresa activa' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getActiveCompany(@Req() req): Promise<ActiveCompanyResponseDto> {
    const userId = req.user.id;
    
    try {
      const companyId = await this.companyContextService.getActiveCompany(userId);
      
      // Obtener info adicional de la empresa (nombre)
      const companies = await this.companyContextService.getUserCompanies(userId);
      const activeCompany = companies.find(company => company.id === companyId);
      
      if (!activeCompany) {
        throw new NotFoundException('No se encontró información de la empresa activa');
      }
      
      return {
        companyId,
        companyName: activeCompany.name,
        userRole: activeCompany.role
      };
    } catch (error) {
      this.logger.error(`Error al obtener empresa activa: ${error.message}`, error);
      throw error;
    }
  }

  @Get('user-companies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtiene todas las empresas a las que pertenece el usuario actual' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de empresas del usuario', 
    type: [CompanyListItemDto] 
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserCompanies(@Req() req): Promise<CompanyListItemDto[]> {
    const userId = req.user.id;
    
    try {
      const companies = await this.companyContextService.getUserCompanies(userId);
      const activeCompanyId = await this.companyContextService.getActiveCompany(userId)
        .catch(() => null); // Si no hay empresa activa, continuamos con null
      
      // Marcar la empresa activa
      return companies.map(company => ({
        ...company,
        isActive: company.id === activeCompanyId
      }));
    } catch (error) {
      this.logger.error(`Error al obtener empresas del usuario: ${error.message}`, error);
      throw error;
    }
  }
} 