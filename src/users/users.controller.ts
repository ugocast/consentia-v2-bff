import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
  Put,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto, UserDto } from './dto/user.dto';
import { CreateUserCompanyDto } from './dto/create-user-company.dto';
import { UserCompanyResponseDto } from './dto/user-company-response.dto';
import { SelectActiveCompanyDto, ActiveCompanyResponseDto } from './dto/select-active-company.dto';
import { SkipCompanyContext } from '../common/decorators/company-context.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @SkipCompanyContext()
  async getCurrentUser(@CurrentUser() user: any): Promise<UserDto> {
    return this.usersService.getCurrentUser(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @SkipCompanyContext()
  async updateUser(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Eliminar cuenta del usuario actual' })
  @ApiResponse({ status: 200, description: 'Cuenta de usuario eliminada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deleteUser(@CurrentUser('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los usuarios (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - se requiere rol admin' })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @ApiOperation({ summary: 'Establecer compañía activa' })
  @ApiResponse({
    status: 200,
    description: 'Compañía activa establecida',
    type: ActiveCompanyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario no pertenece a la compañía',
  })
  @ApiBody({ type: SelectActiveCompanyDto })
  @ApiBearerAuth()
  @Put('active-company')
  @SkipCompanyContext()
  async setActiveCompany(
    @CurrentUser() user: any,
    @Body() selectActiveCompanyDto: SelectActiveCompanyDto,
  ): Promise<ActiveCompanyResponseDto> {
    return this.usersService.setActiveCompany(user.id, selectActiveCompanyDto);
  }

  @Post('me/companies')
  @ApiOperation({ summary: 'Crear una nueva empresa para el usuario actual' })
  @ApiResponse({
    status: 201,
    description: 'Empresa creada exitosamente',
    type: UserCompanyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  @SkipCompanyContext()
  async createUserCompany(
    @CurrentUser() user: any,
    @Body() createUserCompanyDto: CreateUserCompanyDto,
  ): Promise<UserCompanyResponseDto> {
    return this.usersService.createUserCompany(user.id, createUserCompanyDto);
  }
}
