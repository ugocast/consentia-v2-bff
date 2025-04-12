import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import * as supabaseConfig from '../config/supabase.config';
import { AuditService } from '../common/audit/audit.service';
import { SelectActiveCompanyDto } from './dto/select-active-company.dto';
import { ErrorCode } from '../common/interfaces/error-types.interface';

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

// Mock de AuditService
const mockAuditService = {
  logEvent: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let mockClient;
  let mockAdminClient;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Crear mock para la respuesta de Supabase
    mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    };

    // Crear mock para el cliente admin
    mockAdminClient = {
      auth: {
        admin: {
          getUserById: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null
          }),
          updateUserById: jest.fn().mockResolvedValue({
            data: {},
            error: null
          }),
          deleteUser: jest.fn().mockResolvedValue({
            data: {},
            error: null
          }),
          listUsers: jest.fn().mockResolvedValue({
            data: [],
            error: null
          }),
        }
      }
    };

    // Configurar el mock de createSupabaseClient
    (supabaseConfig.createSupabaseClient as jest.Mock).mockImplementation((options) => {
      if (options && options.useServiceKey) {
        return mockAdminClient;
      }
      return mockClient;
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
    expect(service).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return a user by ID', async () => {
      const userId = 'test-user-id';
      const mockUserData = {
        id: userId,
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        created_at: '2023-01-01T00:00:00Z',
      };

      // Configurar la respuesta esperada de Supabase
      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: mockUserData },
        error: null,
      });

      // Mock para company_user
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: { company_id: 'company-1', role: 'admin' },
        error: null,
      });

      // Llamar a getCurrentUser y verificar resultado
      const result = await service.getCurrentUser(userId);

      // Verificar que getUserById fue llamado con el ID correcto
      expect(mockAdminClient.auth.admin.getUserById).toHaveBeenCalledWith(userId);
      
      // Verificar estructura de resultado
      expect(result).toEqual({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        company: {
          id: 'company-1',
          role: 'admin',
        },
      });
    });

    it('should throw NotFoundException when user is not found', async () => {
      const userId = 'non-existent-id';

      // Configurar la respuesta para un usuario no encontrado
      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      // Act & Assert
      await expect(service.getCurrentUser(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const userId = 'test-user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      // Mock para actualizar email
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      // Mock para actualizar metadata (nombre)
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.updateUser(userId, updateUserDto);

      // Verificar que updateUserById fue llamado con los parámetros correctos
      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        { email: updateUserDto.email },
      );
      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        { user_metadata: { name: updateUserDto.name } },
      );

      // Verificar que auditService.logEvent fue llamado
      expect(mockAuditService.logEvent).toHaveBeenCalled();

      // Verificar resultado
      expect(result).toEqual({
        id: userId,
        email: updateUserDto.email,
        name: updateUserDto.name,
      });
    });

    it('should update only name when email is not provided', async () => {
      const userId = 'test-user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name Only',
      };

      // Mock para actualizar metadata (nombre)
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.updateUser(userId, updateUserDto);

      // Verificar que updateUserById fue llamado solo para metadata
      expect(mockAdminClient.auth.admin.updateUserById).not.toHaveBeenCalledWith(
        userId,
        { email: expect.anything() },
      );
      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        { user_metadata: { name: updateUserDto.name } },
      );

      // Verificar resultado
      expect(result).toEqual({
        id: userId,
        name: updateUserDto.name,
      });
    });

    it('should update only email when name is not provided', async () => {
      const userId = 'test-user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'email-only@example.com',
      };

      // Mock para actualizar email
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.updateUser(userId, updateUserDto);

      // Verificar que updateUserById fue llamado solo para email
      expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
        userId,
        { email: updateUserDto.email },
      );
      expect(mockAdminClient.auth.admin.updateUserById).not.toHaveBeenCalledWith(
        userId,
        { user_metadata: expect.anything() },
      );

      // Verificar resultado
      expect(result).toEqual({
        id: userId,
        email: updateUserDto.email,
      });
    });

    it('should throw an error when email update fails', async () => {
      const userId = 'test-user-id';
      const updateUserDto: UpdateUserDto = {
        email: 'invalid-email',
      };

      // Mock para fallo de actualización de email
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid email format' },
      });

      // Act & Assert
      await expect(service.updateUser(userId, updateUserDto)).rejects.toThrow(
        'Error al actualizar email: Invalid email format',
      );
    });

    it('should throw an error when name update fails', async () => {
      const userId = 'test-user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'Invalid Name',
      };

      // Mock para fallo de actualización de metadata
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({
        data: null,
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
      const userId = 'test-user-id';

      // Mock para eliminar usuario
      mockAdminClient.auth.admin.deleteUser.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.deleteUser(userId);

      // Verificar que deleteUser fue llamado con el ID correcto
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
      
      // Verificar que auditService.logEvent fue llamado
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      
      // Verificar resultado
      expect(result).toEqual({ success: true });
    });

    it('should throw an error when delete fails', async () => {
      const userId = 'test-user-id';

      // Mock para fallo de eliminación de usuario
      mockAdminClient.auth.admin.deleteUser.mockResolvedValueOnce({
        data: null,
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
      // Mock para listar usuarios
      mockAdminClient.auth.admin.listUsers.mockResolvedValueOnce({
        data: {
          users: [
            {
              id: 'user-1',
              email: 'user1@example.com',
              user_metadata: { name: 'User One' },
              created_at: '2023-01-01T00:00:00Z',
            },
            {
              id: 'user-2',
              email: 'user2@example.com',
              user_metadata: { name: 'User Two' },
              created_at: '2023-01-02T00:00:00Z',
            },
          ],
        },
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.getAllUsers();

      // Verificar que listUsers fue llamado
      expect(mockAdminClient.auth.admin.listUsers).toHaveBeenCalled();
      
      // Verificar resultado
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        createdAt: '2023-01-01T00:00:00Z',
      });
      expect(result[1]).toEqual({
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two',
        createdAt: '2023-01-02T00:00:00Z',
      });
    });

    it('should handle users with missing metadata', async () => {
      // Mock para listar usuarios con metadata faltante
      mockAdminClient.auth.admin.listUsers.mockResolvedValueOnce({
        data: {
          users: [
            {
              id: 'user-1',
              email: 'user1@example.com',
              // Sin user_metadata
              created_at: '2023-01-01T00:00:00Z',
            },
          ],
        },
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.getAllUsers();

      // Verificar resultado
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'user-1',
        email: 'user1@example.com',
        name: '',
        createdAt: '2023-01-01T00:00:00Z',
      });
    });

    it('should throw InternalServerErrorException when listUsers fails', async () => {
      // Mock para fallo de listUsers
      mockAdminClient.auth.admin.listUsers.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(service.getAllUsers()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('setActiveCompany', () => {
    it('should set active company for user', async () => {
      const userId = 'test-user-id';
      const dto: SelectActiveCompanyDto = {
        companyId: 'company-1',
      };

      // Mock para verificar pertenencia a la compañía
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: { company_id: 'company-1', user_id: userId, role: 'member' },
        error: null,
      });

      // Mock para actualizar compañía activa
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.maybeSingle.mockResolvedValueOnce({
        data: { id: 'active-1', user_id: userId, company_id: 'company-old' },
        error: null,
      });

      mockClient.from.mockReturnValue(mockClient);
      mockClient.update.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: { id: 'active-1', user_id: userId, company_id: dto.companyId },
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.setActiveCompany(userId, dto);

      // Verificar llamadas
      expect(mockClient.from).toHaveBeenCalledWith('company_user');
      expect(mockClient.from).toHaveBeenCalledWith('user_active_company');
      expect(mockClient.update).toHaveBeenCalledWith({ company_id: dto.companyId });
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      
      // Verificar resultado
      expect(result).toEqual({
        activeCompany: dto.companyId,
      });
    });

    it('should create new active company record if none exists', async () => {
      const userId = 'test-user-id';
      const dto: SelectActiveCompanyDto = {
        companyId: 'company-1',
      };

      // Mock para verificar pertenencia a la compañía
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: { company_id: 'company-1', user_id: userId, role: 'member' },
        error: null,
      });

      // Mock para buscar compañía activa (no existe)
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock para insertar nueva compañía activa
      mockClient.from.mockReturnValue(mockClient);
      mockClient.insert.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: { id: 'new-active-1', user_id: userId, company_id: dto.companyId },
        error: null,
      });

      // Llamar al método y verificar
      const result = await service.setActiveCompany(userId, dto);

      // Verificar llamadas
      expect(mockClient.from).toHaveBeenCalledWith('company_user');
      expect(mockClient.from).toHaveBeenCalledWith('user_active_company');
      expect(mockClient.insert).toHaveBeenCalledWith({
        user_id: userId,
        company_id: dto.companyId,
      });
      expect(mockAuditService.logEvent).toHaveBeenCalled();
      
      // Verificar resultado
      expect(result).toEqual({
        activeCompany: dto.companyId,
      });
    });

    it('should throw BadRequestException if user does not belong to company', async () => {
      const userId = 'test-user-id';
      const dto: SelectActiveCompanyDto = {
        companyId: 'company-not-found',
      };

      // Mock para verificar pertenencia a la compañía (no pertenece)
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No se encontró ningún resultado' },
      });

      // Act & Assert
      await expect(service.setActiveCompany(userId, dto)).rejects.toThrow(BadRequestException);
      expect(mockClient.from).toHaveBeenCalledWith('company_user');
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if database error occurs', async () => {
      const userId = 'test-user-id';
      const dto: SelectActiveCompanyDto = {
        companyId: 'company-1',
      };

      // Mock para verificar pertenencia a la compañía
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: { company_id: 'company-1', user_id: userId, role: 'member' },
        error: null,
      });

      // Mock para buscar compañía activa
      mockClient.from.mockReturnValue(mockClient);
      mockClient.select.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.maybeSingle.mockResolvedValueOnce({
        data: { id: 'active-1', user_id: userId, company_id: 'company-old' },
        error: null,
      });

      // Mock para actualizar (falla)
      mockClient.from.mockReturnValue(mockClient);
      mockClient.update.mockReturnValue(mockClient);
      mockClient.eq.mockReturnValue(mockClient);
      mockClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST301', message: 'Database error' },
      });

      // Act & Assert
      await expect(service.setActiveCompany(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockClient.from).toHaveBeenCalledWith('company_user');
      expect(mockClient.from).toHaveBeenCalledWith('user_active_company');
      expect(mockClient.update).toHaveBeenCalled();
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });
  });
});
