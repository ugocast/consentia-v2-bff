import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ConsentDataTypesService } from './consent-data-types.service';
import {
  CreateConsentDataTypeDto,
  UpdateConsentDataTypeDto,
  ConsentDataTypeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequireCompanyContext } from '../common/decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';

@ApiTags('consent-data-types')
@ApiBearerAuth()
@Controller('consent-data-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireCompanyContext()
export class ConsentDataTypesController {
  constructor(private readonly consentDataTypesService: ConsentDataTypesService) {}

  /**
   * Crea un nuevo tipo de dato de consentimiento
   * @param createConsentDataTypeDto - DTO con los datos para crear el tipo de dato
   * @param userId - ID del usuario autenticado
   * @returns Tipo de dato de consentimiento creado
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear un nuevo tipo de dato de consentimiento' })
  @ApiResponse({ status: 201, description: 'Tipo de dato creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  create(
    @Body() createConsentDataTypeDto: CreateConsentDataTypeDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsentDataTypeDto> {
    return this.consentDataTypesService.create(
      createConsentDataTypeDto,
      userId,
    );
  }

  /**
   * Obtiene todos los tipos de datos de un consentimiento
   * @param consentId - ID del consentimiento
   * @returns Lista de tipos de datos de consentimiento
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Obtener todos los tipos de datos de un consentimiento' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de datos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  findAll(@Query('consentId') consentId: string): Promise<ConsentDataTypeDto[]> {
    return this.consentDataTypesService.findAll(consentId);
  }

  /**
   * Obtiene un tipo de dato de consentimiento por su ID
   * @param id - ID del tipo de dato de consentimiento
   * @returns Tipo de dato de consentimiento encontrado
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Obtener un tipo de dato de consentimiento por su ID' })
  @ApiResponse({ status: 200, description: 'Tipo de dato encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Tipo de dato no encontrado' })
  findOne(@Param('id') id: string): Promise<ConsentDataTypeDto> {
    return this.consentDataTypesService.findOne(id);
  }

  /**
   * Actualiza un tipo de dato de consentimiento
   * @param id - ID del tipo de dato de consentimiento
   * @param updateConsentDataTypeDto - DTO con los datos para actualizar el tipo de dato
   * @param userId - ID del usuario autenticado
   * @returns Tipo de dato de consentimiento actualizado
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar un tipo de dato de consentimiento' })
  @ApiResponse({ status: 200, description: 'Tipo de dato actualizado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Tipo de dato no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateConsentDataTypeDto: UpdateConsentDataTypeDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConsentDataTypeDto> {
    return this.consentDataTypesService.update(
      id,
      updateConsentDataTypeDto,
      userId,
    );
  }

  /**
   * Elimina un tipo de dato de consentimiento (cambia su estado a DELETED)
   * @param id - ID del tipo de dato de consentimiento
   * @param userId - ID del usuario autenticado
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un tipo de dato de consentimiento' })
  @ApiResponse({ status: 200, description: 'Tipo de dato eliminado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Tipo de dato no encontrado' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.consentDataTypesService.remove(id, userId);
  }
}
