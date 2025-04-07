import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataTypesService } from './data-types.service';
import {
  CreateDataTypeDto,
  UpdateDataTypeDto,
  DataTypeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCompanyContext } from '../common/decorators/company-context.decorator';
import { RequestWithCompanyContext } from '../common/interfaces/company-context.interface';

@ApiTags('data-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('data-types')
@RequireCompanyContext()
export class DataTypesController {
  constructor(private readonly dataTypesService: DataTypesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new data type' })
  @ApiResponse({
    status: 201,
    description: 'The data type has been successfully created.',
    type: DataTypeDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createDataTypeDto: CreateDataTypeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataTypesService.create(createDataTypeDto, userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Get all data types' })
  @ApiResponse({
    status: 200,
    description: 'List of data types',
    type: [DataTypeDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.dataTypesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Get data type by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found data type',
    type: DataTypeDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Data type not found' })
  findOne(@Param('id') id: string) {
    return this.dataTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a data type' })
  @ApiResponse({
    status: 200,
    description: 'The data type has been successfully updated.',
    type: DataTypeDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Data type not found' })
  update(
    @Param('id') id: string,
    @Body() updateDataTypeDto: UpdateDataTypeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataTypesService.update(id, updateDataTypeDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a data type' })
  @ApiResponse({
    status: 200,
    description: 'The data type has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Data type not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataTypesService.remove(id, userId);
  }
}
