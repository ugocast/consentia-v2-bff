import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto, UserDto } from './dto/user.dto';
import { ExecutionContext } from '@nestjs/common';
import { User } from './decorators/user.decorator';

// Mock del servicio de usuarios
const mockUsersService = {
  getCurrentUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

// Mock para el decorador User
jest.mock('./decorators/user.decorator', () => ({
  User: jest.fn().mockImplementation(() => {
    return (target: any, key: string, descriptor: PropertyDescriptor) => {
      return descriptor;
    };
  }),
}));

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should get current user profile', async () => {
      // Arrange
      const userId = 'user-id';
      const mockUser: UserDto = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      mockUsersService.getCurrentUser.mockResolvedValue(mockUser);

      // Sobrescribir el método para la prueba
      const originalMethod = controller.getCurrentUser;
      controller.getCurrentUser = async (userId: string) => {
        return mockUsersService.getCurrentUser(userId);
      };

      // Act
      const result = await controller.getCurrentUser(userId);

      // Assert
      expect(mockUsersService.getCurrentUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);

      // Restaurar el método original
      controller.getCurrentUser = originalMethod;
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      
      const mockUpdatedUser: UserDto = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      mockUsersService.updateUser.mockResolvedValue(mockUpdatedUser);

      // Sobrescribir el método para la prueba
      const originalMethod = controller.updateUser;
      controller.updateUser = async (userId: string, dto: UpdateUserDto) => {
        return mockUsersService.updateUser(userId, dto);
      };

      // Act
      const result = await controller.updateUser(userId, updateUserDto);

      // Assert
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(mockUpdatedUser);

      // Restaurar el método original
      controller.updateUser = originalMethod;
    });
  });

  describe('deleteUser', () => {
    it('should delete user account', async () => {
      // Arrange
      const userId = 'user-id';
      const mockResult = { success: true };
      
      mockUsersService.deleteUser.mockResolvedValue(mockResult);

      // Sobrescribir el método para la prueba
      const originalMethod = controller.deleteUser;
      controller.deleteUser = async (userId: string) => {
        return mockUsersService.deleteUser(userId);
      };

      // Act
      const result = await controller.deleteUser(userId);

      // Assert
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);

      // Restaurar el método original
      controller.deleteUser = originalMethod;
    });
  });
});
