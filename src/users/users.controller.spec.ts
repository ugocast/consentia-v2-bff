import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateUserDto, UserDto } from './dto/user.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SelectActiveCompanyDto, ActiveCompanyResponseDto } from './dto/select-active-company.dto';

// Mock del servicio de usuarios siguiendo el patrón AAA
const mockUsersService = {
  getCurrentUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getAllUsers: jest.fn(),
  setActiveCompany: jest.fn(),
};

// Mock de los guardias
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

// Crear un usuario mock para las pruebas
const createMockUser = (id = 'user-id', overrides = {}) => ({
  id,
  email: `test-${id}@example.com`,
  name: `Test User ${id}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    // Assert
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should get current user profile when valid ID is provided', async () => {
      // Arrange
      const userId = 'user-id';
      const mockUser = createMockUser(userId, {
        email: 'test@example.com',
        name: 'Test User'
      });

      mockUsersService.getCurrentUser.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getCurrentUser(userId);

      // Assert
      expect(mockUsersService.getCurrentUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const error = new NotFoundException('Usuario no encontrado');
      
      mockUsersService.getCurrentUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getCurrentUser(userId)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.getCurrentUser).toHaveBeenCalledWith(userId);
    });

    it('should propagate other errors from service', async () => {
      // Arrange
      const userId = 'error-id';
      const error = new InternalServerErrorException('Error en el servidor');
      
      mockUsersService.getCurrentUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getCurrentUser(userId)).rejects.toThrow(InternalServerErrorException);
      expect(mockUsersService.getCurrentUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateUser', () => {
    it('should update user profile when valid data is provided', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const mockUpdatedUser = createMockUser(userId, {
        name: 'Updated Name',
        updated_at: '2023-01-02T00:00:00Z',
      });

      mockUsersService.updateUser.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.updateUser(userId, updateUserDto);

      // Assert
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should update user email when provided', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
      };

      const mockUpdatedUser = createMockUser(userId, {
        email: 'updated@example.com',
        updated_at: '2023-01-02T00:00:00Z',
      });

      mockUsersService.updateUser.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.updateUser(userId, updateUserDto);

      // Assert
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result.email).toBe(updateUserDto.email);
    });

    it('should update both name and email when provided together', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Full Update',
        email: 'full-update@example.com',
      };

      const mockUpdatedUser = createMockUser(userId, {
        name: 'Full Update',
        email: 'full-update@example.com',
        updated_at: '2023-01-02T00:00:00Z',
      });

      mockUsersService.updateUser.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.updateUser(userId, updateUserDto);

      // Assert
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result.name).toBe(updateUserDto.name);
      expect(result.email).toBe(updateUserDto.email);
    });

    it('should propagate errors when update fails', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'invalid-email',
      };
      const error = new InternalServerErrorException('Error al actualizar email');
      
      mockUsersService.updateUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.updateUser(userId, updateUserDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
    });
  });

  describe('deleteUser', () => {
    it('should delete user account when valid ID is provided', async () => {
      // Arrange
      const userId = 'user-id';
      const mockResult = { success: true };

      mockUsersService.deleteUser.mockResolvedValue(mockResult);

      // Act
      const result = await controller.deleteUser(userId);

      // Assert
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const error = new NotFoundException('Usuario no encontrado');
      
      mockUsersService.deleteUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.deleteUser(userId)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should propagate other errors when deletion fails', async () => {
      // Arrange
      const userId = 'protected-user-id';
      const error = new InternalServerErrorException('Error al eliminar usuario');
      
      mockUsersService.deleteUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.deleteUser(userId)).rejects.toThrow(InternalServerErrorException);
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users when called by admin', async () => {
      // Arrange
      const mockUsers = [
        createMockUser('user-1', { email: 'user1@example.com', name: 'User One' }),
        createMockUser('user-2', { email: 'user2@example.com', name: 'User Two' }),
        createMockUser('user-3', { email: 'user3@example.com', name: 'User Three' }),
      ];

      mockUsersService.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      const result = await controller.getAllUsers();

      // Assert
      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockUsersService.getAllUsers.mockResolvedValue([]);

      // Act
      const result = await controller.getAllUsers();

      // Assert
      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should propagate errors from service', async () => {
      // Arrange
      const error = new InternalServerErrorException('Error al obtener usuarios');
      
      mockUsersService.getAllUsers.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getAllUsers()).rejects.toThrow(InternalServerErrorException);
      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('setActiveCompany', () => {
    it('should set active company for user', async () => {
      // Arrange
      const user = { id: 'user-1' };
      const selectActiveCompanyDto: SelectActiveCompanyDto = {
        companyId: 'company-1',
      };
      const mockActiveCompanyResponse: ActiveCompanyResponseDto = {
        success: true,
        message: 'Compañía activa establecida correctamente',
        companyId: 'company-1',
        companyName: 'Test Company',
      };

      mockUsersService.setActiveCompany.mockResolvedValue(mockActiveCompanyResponse);

      // Act
      const result = await controller.setActiveCompany(user, selectActiveCompanyDto);

      // Assert
      expect(mockUsersService.setActiveCompany).toHaveBeenCalledWith(user.id, selectActiveCompanyDto);
      expect(result).toEqual(mockActiveCompanyResponse);
    });
  });
});
