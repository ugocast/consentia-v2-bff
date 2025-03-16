import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './decorators/user.decorator';
import { UpdateUserDto } from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@User('sub') userId: string) {
    return this.usersService.getCurrentUser(userId);
  }

  @Patch('me')
  async updateUser(@User('sub') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(userId, updateUserDto);
  }

  @Delete('me')
  async deleteUser(@User('sub') userId: string) {
    return this.usersService.deleteUser(userId);
  }
}
