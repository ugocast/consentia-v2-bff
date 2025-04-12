import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { mockSupabaseClient } from '../common/mocks/supabase.mock';
import { UpdateUserDto } from './dto/user.dto';
import * as supabaseConfig from '../config/supabase.config';
import { AuditService } from '../common/audit/audit.service';
import { SelectActiveCompanyDto } from './dto/select-active-company.dto';

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

// Extender el mockSupabaseClient para incluir la función admin
// @ts-ignore: Ignorar error de tipado en el mock para pruebas
mockSupabaseClient.auth.admin = {
  getUserById: jest.fn(),
  updateUserById: jest.fn(),
  deleteUser: jest.fn(),
  listUsers: jest.fn(),
};

// Mock de AuditService
const mockAuditService = {
  logEvent: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let mockSupabaseClient;
  let mockSupabaseAdminClient;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // También limpiamos los mocks de admin manualmente
    // @ts-ignore
    Object.keys(mockSupabaseClient.auth.admin).forEach(key => {
      // @ts-ignore
      mockSupabaseClient.auth.admin[key].mockReset();
    });

    // Configurar el mock para devolver el cliente de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(
      mockSupabaseClient,
    );

    // Crear mock para la respuesta de Supabase
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    };

    mockSupabaseAdminClient = {
      auth: {
        admin: {
          getUserById: jest.fn(),
          updateUserById: jest.fn(),
          deleteUser: jest.fn(),
          listUsers: jest.fn(),
        },
      },
    };

    // Configurar el mock de createSupabaseClient
    (supabaseConfig.createSupabaseClient as jest.Mock).mockImplementation((options) => {
      if (options && options.useServiceKey) {
        return mockSupabaseAdminClient;
      }
      return mockSupabaseClient;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    // Assert
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

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.getCurrentUser(userId);

      // Assert
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.getUserById).toHaveBeenCalledWith(
        userId,
      );
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

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      });

      // Act & Assert
      await expect(service.getCurrentUser(userId)).rejects.toThrow(
        NotFoundException,
      );
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

      // Mock para la actualización de email
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock para la actualización de nombre
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock para getCurrentUser que se llama al final
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.updateUser(userId, updateUserDto);

      // Assert
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          email: updateUserDto.email,
        }),
      );

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          user_metadata: { name: updateUserDto.name },
        }),
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

      // Mock para la actualización de nombre
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock para getCurrentUser que se llama al final
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.updateUser(userId, updateUserDto);

      // Assert
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          user_metadata: { name: updateUserDto.name },
        }),
      );

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.name,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
    });

    it('should update only email when name is not provided', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
      };

      const mockUser = {
        id: userId,
        email: updateUserDto.email,
        user_metadata: { name: 'Existing User' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };

      // Mock para la actualización de email
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock para getCurrentUser que se llama al final
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await service.updateUser(userId, updateUserDto);

      // Assert
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          email: updateUserDto.email,
        }),
      );

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.updateUserById).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.name,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
    });

    it('should throw an error when email update fails', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'invalid-email',
      };

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email format' },
      });

      // Act & Assert
      await expect(service.updateUser(userId, updateUserDto)).rejects.toThrow(
        'Error al actualizar email: Invalid email format',
      );
    });

    it('should throw an error when name update fails', async () => {
      // Arrange
      const userId = 'user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'New Name',
      };

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'Metadata update failed' },
      });

      // Act & Assert
      await expect(service.updateUser(userId, updateUserDto)).rejects.toThrow(
        'Error al actualizar nombre: Metadata update failed',
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Arrange
      const userId = 'user-id';

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        error: null,
      });

      // Act
      const result = await service.deleteUser(userId);

      // Assert
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw an error when delete fails', async () => {
      // Arrange
      const userId = 'non-existent-user-id';

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        error: { message: 'User not found' },
      });

      // Act & Assert
      await expect(service.deleteUser(userId)).rejects.toThrow(
        'Error al eliminar usuario: User not found',
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Arrange
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          user_metadata: { name: 'User One' },
          created_at: '2023-01-01T00:00:00Z',
          last_sign_in_at: '2023-01-10T00:00:00Z',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          user_metadata: { name: 'User Two' },
          created_at: '2023-01-02T00:00:00Z',
          last_sign_in_at: '2023-01-11T00:00:00Z',
        },
      ];

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockUsers },
        error: null,
      });

      // Act
      const result = await service.getAllUsers();

      // Assert
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      expect(mockSupabaseClient.auth.admin.listUsers).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockUsers[0].id,
        email: mockUsers[0].email,
        name: mockUsers[0].user_metadata.name,
        createdAt: mockUsers[0].created_at,
        lastSignIn: mockUsers[0].last_sign_in_at,
      });
      expect(result[1]).toEqual({
        id: mockUsers[1].id,
        email: mockUsers[1].email,
        name: mockUsers[1].user_metadata.name,
        createdAt: mockUsers[1].created_at,
        lastSignIn: mockUsers[1].last_sign_in_at,
      });
    });

    it('should handle users with missing metadata', async () => {
      // Arrange
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          user_metadata: null,
          created_at: '2023-01-01T00:00:00Z',
          last_sign_in_at: '2023-01-10T00:00:00Z',
        },
      ];

      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockUsers },
        error: null,
      });

      // Act
      const result = await service.getAllUsers();

      // Assert
      expect(result[0].name).toBe('');
    });

    it('should throw InternalServerErrorException when listUsers fails', async () => {
      // Arrange
      // @ts-ignore: Ignorar error de tipado en el mock para pruebas
      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        data: null,
        error: { message: 'Failed to list users' },
      });

      // Act & Assert
      await expect(service.getAllUsers()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('setActiveCompany', () => {
    it('should set active company for user', async () => {
      // Arrange
      const userId = 'user-1';
      const selectActiveCompanyDto: SelectActiveCompanyDto = {
        companyId: 'company-1',
      };

      // Mock para verificar pertenencia a la compañía
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'company-user-1',
          company: {
            id: 'company-1',
            name: 'Test Company',
          },
        },
        error: null,
      });

      // Mock para verificar si ya existe un registro de compañía activa
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'active-company-1',
        },
        error: null,
      });

      // Mock para actualizar el registro existente
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: null,
      });

      // Mock para actualizar los metadatos del usuario
      mockSupabaseAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      // Act
      const result = await service.setActiveCompany(userId, selectActiveCompanyDto);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, company:company_id(id, name)');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('auth_id', userId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', 'company-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_active_company');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockSupabaseAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        {
          user_metadata: {
            active_company_id: 'company-1',
            onboarding_status: 'ONBOARDING_COMPLETED'
          },
        }
      );
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Compañía activa establecida correctamente',
        companyId: 'company-1',
        companyName: 'Test Company',
      });
    });

    it('should create new active company record if none exists', async () => {
      // Arrange
      const userId = 'user-1';
      const selectActiveCompanyDto: SelectActiveCompanyDto = {
        companyId: 'company-1',
      };

      // Mock para verificar pertenencia a la compañía
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'company-user-1',
          company: {
            id: 'company-1',
            name: 'Test Company',
          },
        },
        error: null,
      });

      // Mock para verificar si ya existe un registro de compañía activa (no existe)
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock para crear un nuevo registro
      mockSupabaseClient.insert.mockResolvedValueOnce({
        error: null,
      });

      // Mock para actualizar los metadatos del usuario
      mockSupabaseAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      // Act
      const result = await service.setActiveCompany(userId, selectActiveCompanyDto);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, company:company_id(id, name)');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_active_company');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      expect(mockSupabaseAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        expect.any(Object)
      );
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if user does not belong to company', async () => {
      // Arrange
      const userId = 'user-1';
      const selectActiveCompanyDto: SelectActiveCompanyDto = {
        companyId: 'company-2',
      };

      // Mock para verificar pertenencia a la compañía (no pertenece)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'No data found',
        },
      });

      // Act & Assert
      await expect(service.setActiveCompany(userId, selectActiveCompanyDto))
        .rejects.toThrow(BadRequestException);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('user_active_company');
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if database error occurs', async () => {
      // Arrange
      const userId = 'user-1';
      const selectActiveCompanyDto: SelectActiveCompanyDto = {
        companyId: 'company-1',
      };

      // Mock para verificar pertenencia a la compañía
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'company-user-1',
          company: {
            id: 'company-1',
            name: 'Test Company',
          },
        },
        error: null,
      });

      // Mock para verificar si ya existe un registro de compañía activa
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'active-company-1',
        },
        error: null,
      });

      // Mock para actualizar el registro existente (falla)
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: {
          message: 'Database error',
        },
      });

      // Act & Assert
      await expect(service.setActiveCompany(userId, selectActiveCompanyDto))
        .rejects.toThrow(InternalServerErrorException);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_active_company');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });
  });
});
