import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { mockSupabaseClient, mockCreateSupabaseClient } from '../common/mocks/supabase.mock';
import { UpdateUserDto } from './dto/user.dto';
import * as supabaseConfig from '../config/supabase.config';

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar el mock para devolver el cliente de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return a user by ID', async () => {
      // Arrange
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.getCurrentUser(userId);

      // Assert
      expect(mockSupabaseClient.auth.admin.getUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.name,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Arrange
      const userId = 'non-existent-user-id';
      
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      });

      // Act & Assert
      await expect(service.getCurrentUser(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        name: 'Updated User',
      };
      
      const mockUser = {
        id: userId,
        email: updateUserDto.email,
        user_metadata: { name: updateUserDto.name },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.updateUser(userId, updateUserDto);

      // Assert
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          email: updateUserDto.email,
        })
      );
      
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.name,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
    });

    it('should update only name when email is not provided', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated User',
      };
      
      const mockUser = {
        id: userId,
        email: 'existing@example.com',
        user_metadata: { name: updateUserDto.name },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.updateUser(userId, updateUserDto);

      // Assert
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          user_metadata: { name: updateUserDto.name },
        })
      );
      
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.name,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
    });

    it('should throw an error when update fails', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'invalid-email',
        name: 'Updated User',
      };
      
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email format' },
      });

      // Act & Assert
      await expect(service.updateUser(userId, updateUserDto)).rejects.toThrow(
        'Error al actualizar email: Invalid email format',
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Arrange
      const userId = 'user-id';
      
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        error: null,
      });

      // Act
      const result = await service.deleteUser(userId);

      // Assert
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ success: true });
    });

    it('should throw an error when delete fails', async () => {
      // Arrange
      const userId = 'non-existent-user-id';
      
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        error: { message: 'User not found' },
      });

      // Act & Assert
      await expect(service.deleteUser(userId)).rejects.toThrow(
        'Error al eliminar usuario: User not found',
      );
    });
  });
});
