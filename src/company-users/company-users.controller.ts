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
  ValidationPipe,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyUsersService } from './company-users.service';
import {
  CreateCompanyUserDto,
  UpdateCompanyUserDto,
  CompanyUserDto,
  ChangeUserStatusDto,
  ChangeUserRoleDto,
  UserActivityDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCompanyContext } from '../common/decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';

@ApiTags('company-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies/:companyId/users')
@RequireCompanyContext({ requireInParams: true })
export class CompanyUsersController {
  constructor(private readonly companyUsersService: CompanyUsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new company user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: CompanyUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Param('companyId') companyId: string,
    @Body() createCompanyUserDto: CreateCompanyUserDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.companyUsersService.create(
      companyId,
      createCompanyUserDto,
      adminUserId,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Get all company users' })
  @ApiResponse({
    status: 200,
    description: 'List of company users',
    type: [CompanyUserDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Param('companyId') companyId: string,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    return this.companyUsersService.findAll(companyId, includeDeleted);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Get a company user by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found user',
    type: CompanyUserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    return this.companyUsersService.findOne(companyId, id, includeDeleted);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a company user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
    type: CompanyUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateCompanyUserDto: UpdateCompanyUserDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.companyUsersService.update(
      companyId,
      id,
      updateCompanyUserDto,
      adminUserId,
    );
  }

  @Patch(':id/self-update')
  @ApiOperation({ summary: 'Update own user profile (self update)' })
  @ApiResponse({
    status: 200,
    description: 'The user profile has been successfully updated.',
    type: CompanyUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateSelf(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateCompanyUserDto,
    @CurrentUser('id') userId: string,
  ) {
    // Validar que el usuario está actualizando su propio perfil
    if (id !== userId) {
      throw new ForbiddenException('You can only update your own profile with this endpoint');
    }
    
    return this.companyUsersService.updateSelfProfile(companyId, id, updateDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Change user status' })
  @ApiResponse({
    status: 200,
    description: 'The user status has been successfully changed.',
    type: CompanyUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request or invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changeStatus(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeUserStatusDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.companyUsersService.changeStatus(
      companyId,
      id,
      changeStatusDto,
      adminUserId,
    );
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({
    status: 200,
    description: 'The user role has been successfully changed.',
    type: CompanyUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or user not active' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changeRole(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeUserRoleDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.companyUsersService.changeRole(
      companyId,
      id,
      changeRoleDto,
      adminUserId,
    );
  }

  @Get(':id/activity')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get user activity history' })
  @ApiResponse({
    status: 200,
    description: 'User activity history',
    type: UserActivityDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getActivity(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') requestUserId: string,
  ) {
    return this.companyUsersService.getActivity(companyId, id, requestUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a company user' })
  @ApiResponse({ status: 204, description: 'The user has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.companyUsersService.remove(companyId, id, adminUserId);
  }
}
