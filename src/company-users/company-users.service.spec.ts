import { Test, TestingModule } from '@nestjs/testing';
import { 
  NotFoundException, 
  ConflictException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { CompanyUsersService } from './company-users.service';
import { AuditService } from '../common/audit/audit.service';
import { mockSupabaseClient } from '../common/mocks/supabase.mock';
import * as supabaseConfig from '../config/supabase.config';
import { 
  CompanyUserStatus, 
  CompanyUserRole, 
  CreateCompanyUserDto, 
  UpdateCompanyUserDto,
  ChangeUserStatusDto,
  ChangeUserRoleDto
} from './dto';

// Mock para el servicio de auditoría
const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

// Mock para la función createSupabaseClient
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('CompanyUsersService', () => {
  let service: CompanyUsersService;

  // Mock data para pruebas
  const mockCompanyId = 'company-123';
  const mockAdminUserId = 'admin-123';
  const mockUserId = 'user-123';
  const mockAuthId = 'auth-123';

  // Mock para un usuario de compañía
  const mockCompanyUser = {
    company_user_id: mockUserId,
    company_id: mockCompanyId,
    auth_id: mockAuthId,
    email: 'test@example.com',
    full_name: 'Test User',
    role: CompanyUserRole.OPERATOR,
    status: CompanyUserStatus.ACTIVE,
    metadata: {},
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    // Arrange - Setup
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    // Configurar el mock de Supabase
    (supabaseConfig.createSupabaseClient as jest.Mock).mockReturnValue(
      mockSupabaseClient,
    );

    // Configurar comportamiento por defecto para los métodos comunes
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.neq.mockReturnThis();
    mockSupabaseClient.order.mockReturnThis();
    mockSupabaseClient.single.mockImplementation(() => {
      return {
        then: jest.fn().mockImplementation(callback => {
          return callback({ data: null, error: null });
        })
      };
    });
    mockSupabaseClient.insert.mockReturnThis();
    mockSupabaseClient.update.mockReturnThis();

    // Crear el módulo de prueba
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyUsersService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<CompanyUsersService>(CompanyUsersService);

    // Mock de los métodos de validación internos para evitar llamadas reales
    jest.spyOn(service as any, 'validateCompanyExists').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'validateUserBelongsToCompany').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'validateAdminPermissions').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  // Pruebas para create()
  describe('create', () => {
    it('should create a company user successfully', async () => {
      // Arrange
      const createDto: CreateCompanyUserDto = {
        authId: mockAuthId,
        email: 'test@example.com',
        fullName: 'Test User',
        role: CompanyUserRole.OPERATOR,
      };

      // Mock para validateEmailUniqueness
      jest.spyOn(service as any, 'validateEmailUniqueness').mockResolvedValue(undefined);

      // Mock para validateAuthIdUniqueness
      jest.spyOn(service as any, 'validateAuthIdUniqueness').mockResolvedValue(undefined);

      // Configurar la cadena de mocks
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      
      // Mock para insert y single
      mockSupabaseClient.single.mockImplementationOnce(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: mockCompanyUser, error: null });
          })
        };
      });

      // Act
      const result = await service.create(mockCompanyId, createDto, mockAdminUserId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
      
      expect(result).toEqual({
        id: mockCompanyUser.company_user_id,
        companyId: mockCompanyUser.company_id,
        authId: mockCompanyUser.auth_id,
        email: mockCompanyUser.email,
        fullName: mockCompanyUser.full_name,
        role: mockCompanyUser.role,
        status: mockCompanyUser.status,
        metadata: mockCompanyUser.metadata,
        createdAt: mockCompanyUser.created_at,
        updatedAt: mockCompanyUser.updated_at,
      });
    });

    it('should throw NotFoundException when company does not exist', async () => {
      // Arrange
      const createDto: CreateCompanyUserDto = {
        authId: mockAuthId,
        email: 'test@example.com',
        fullName: 'Test User',
        role: CompanyUserRole.OPERATOR,
      };

      // Mock para validateCompanyExists - falla
      jest.spyOn(service as any, 'validateCompanyExists').mockRejectedValueOnce(
        new NotFoundException(`Company with ID ${mockCompanyId} not found`)
      );

      // Act & Assert
      await expect(service.create(mockCompanyId, createDto, mockAdminUserId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists in company', async () => {
      // Arrange
      const createDto: CreateCompanyUserDto = {
        authId: mockAuthId,
        email: 'existing@example.com',
        fullName: 'Test User',
        role: CompanyUserRole.OPERATOR,
      };

      // Mock para validateEmailUniqueness - falla
      jest.spyOn(service as any, 'validateEmailUniqueness').mockRejectedValueOnce(
        new ConflictException(`Email ${createDto.email} is already in use in this company`)
      );

      // Act & Assert
      await expect(service.create(mockCompanyId, createDto, mockAdminUserId))
        .rejects.toThrow(ConflictException);
    });
  });

  // Pruebas para findAll()
  describe('findAll', () => {
    it('should return all company users', async () => {
      // Arrange
      const mockCompanyUsers = [
        mockCompanyUser,
        {
          ...mockCompanyUser,
          company_user_id: 'user-456',
          email: 'user2@example.com',
          full_name: 'User Two',
        },
      ];

      // Mock for the chain ending
      mockSupabaseClient.order.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: mockCompanyUsers, error: null });
          })
        };
      });

      // Act
      const result = await service.findAll(mockCompanyId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.select).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', mockCompanyId);
      expect(mockSupabaseClient.neq).toHaveBeenCalledWith('status', CompanyUserStatus.DELETED);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(mockCompanyUsers[0].company_user_id);
      expect(result[1].id).toBe(mockCompanyUsers[1].company_user_id);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      // Arrange
      const mockCompanyUsers = [
        mockCompanyUser,
        {
          ...mockCompanyUser,
          company_user_id: 'deleted-user',
          status: CompanyUserStatus.DELETED,
        },
      ];

      // Mock for the chain ending
      mockSupabaseClient.order.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: mockCompanyUsers, error: null });
          })
        };
      });

      // Act
      const result = await service.findAll(mockCompanyId, true);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(result.length).toBe(2);
      expect(result.some(user => user.status === CompanyUserStatus.DELETED)).toBe(true);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      // Arrange
      // Mock para validateCompanyExists - falla
      jest.spyOn(service as any, 'validateCompanyExists').mockRejectedValueOnce(
        new NotFoundException(`Company with ID ${mockCompanyId} not found`)
      );

      // Act & Assert
      await expect(service.findAll(mockCompanyId))
        .rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para findOne()
  describe('findOne', () => {
    it('should return a company user by ID', async () => {
      // Arrange
      // Mock para findOne
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: mockCompanyUser, error: null });
          })
        };
      });

      // Act
      const result = await service.findOne(mockCompanyId, mockUserId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.select).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', mockCompanyId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_user_id', mockUserId);
      expect(result.id).toBe(mockCompanyUser.company_user_id);
      expect(result.email).toBe(mockCompanyUser.email);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      // Mock para findOne - falla
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: null, error: { message: 'No rows found' } });
          })
        };
      });

      // Act & Assert
      await expect(service.findOne(mockCompanyId, 'non-existent-user'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para update()
  describe('update', () => {
    it('should update a company user successfully', async () => {
      // Arrange
      const updateDto: UpdateCompanyUserDto = {
        fullName: 'Updated User Name',
      };

      // Mock para validateEmailUniqueness si se cambia el email
      jest.spyOn(service as any, 'validateEmailUniqueness').mockResolvedValue(undefined);

      // Primera vez, findOne para obtener el usuario actual
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        id: mockCompanyUser.company_user_id,
        companyId: mockCompanyUser.company_id,
        authId: mockCompanyUser.auth_id,
        email: mockCompanyUser.email,
        fullName: mockCompanyUser.full_name,
        role: mockCompanyUser.role,
        status: mockCompanyUser.status,
        metadata: mockCompanyUser.metadata,
        createdAt: mockCompanyUser.created_at,
        updatedAt: mockCompanyUser.updated_at,
      });

      // Mock para update
      const updatedUser = {
        ...mockCompanyUser,
        full_name: 'Updated User Name',
        updated_at: '2023-01-02T00:00:00Z',
      };
      mockSupabaseClient.single.mockImplementationOnce(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: updatedUser, error: null });
          })
        };
      });

      // Act
      const result = await service.update(mockCompanyId, mockUserId, updateDto, mockAdminUserId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(result.fullName).toBe('Updated User Name');
    });

    it('should throw ForbiddenException when trying to update a deleted user', async () => {
      // Arrange
      const updateDto: UpdateCompanyUserDto = {
        fullName: 'Updated User Name',
      };

      // Mock para findOne que devuelve un usuario eliminado
      const mockFindOne = jest.spyOn(service, 'findOne');
      const deletedUser = {
        id: mockCompanyUser.company_user_id,
        companyId: mockCompanyUser.company_id,
        authId: mockCompanyUser.auth_id,
        email: mockCompanyUser.email,
        fullName: mockCompanyUser.full_name,
        role: mockCompanyUser.role,
        status: CompanyUserStatus.DELETED,
        metadata: mockCompanyUser.metadata,
        createdAt: mockCompanyUser.created_at,
        updatedAt: mockCompanyUser.updated_at,
      };
      mockFindOne.mockResolvedValueOnce(deletedUser);

      // Act & Assert
      await expect(service.update(mockCompanyId, mockUserId, updateDto, mockAdminUserId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // Pruebas para findByUserAndCompany()
  describe('findByUserAndCompany', () => {
    it('should find user by auth ID and company ID', async () => {
      // Arrange
      // Mock para la cadena completa
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.neq.mockReturnThis();
      
      // Mock específico para el método single() en esta prueba
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: mockCompanyUser, error: null });
          })
        };
      });

      // Act
      const result = await service.findByUserAndCompany(mockAuthId, mockCompanyId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.select).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('auth_id', mockAuthId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', mockCompanyId);
      expect(result).not.toBeNull();
      expect(result?.authId).toBe(mockAuthId);
    });

    it('should return null when user not found', async () => {
      // Arrange
      // Mock para la cadena completa
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.neq.mockReturnThis();
      
      // Mock específico para el método single() en esta prueba - falla
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: null, error: { message: 'No rows found' } });
          })
        };
      });

      // Act
      const result = await service.findByUserAndCompany('non-existent-auth-id', mockCompanyId);

      // Assert
      expect(result).toBeNull();
    });
  });

  // Pruebas para changeStatus()
  describe('changeStatus', () => {
    it('should change user status successfully', async () => {
      // Arrange
      const statusDto: ChangeUserStatusDto = {
        status: CompanyUserStatus.INACTIVE,
      };

      // Mock para findOne
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        id: mockCompanyUser.company_user_id,
        companyId: mockCompanyUser.company_id,
        authId: mockCompanyUser.auth_id,
        email: mockCompanyUser.email,
        fullName: mockCompanyUser.full_name,
        role: mockCompanyUser.role,
        status: CompanyUserStatus.ACTIVE,
        metadata: mockCompanyUser.metadata,
        createdAt: mockCompanyUser.created_at,
        updatedAt: mockCompanyUser.updated_at,
      });

      // Mock para validateStatusTransition 
      jest.spyOn(service as any, 'validateStatusTransition').mockReturnValueOnce(undefined);

      // Mock para update
      const updatedUser = {
        ...mockCompanyUser,
        status: CompanyUserStatus.INACTIVE,
        updated_at: '2023-01-02T00:00:00Z',
      };
      mockSupabaseClient.single.mockImplementationOnce(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: updatedUser, error: null });
          })
        };
      });

      // Act
      const result = await service.changeStatus(
        mockCompanyId,
        mockUserId,
        statusDto,
        mockAdminUserId,
      );

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(result.status).toBe(CompanyUserStatus.INACTIVE);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const statusDto: ChangeUserStatusDto = {
        status: CompanyUserStatus.INACTIVE,
      };

      // Mock para findOne que lanza NotFoundException
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockRejectedValueOnce(
        new NotFoundException(`Company user with ID non-existent-user not found or inaccessible`)
      );

      // Act & Assert
      await expect(
        service.changeStatus(mockCompanyId, 'non-existent-user', statusDto, mockAdminUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to set status to DELETED', async () => {
      // Arrange
      const statusDto: ChangeUserStatusDto = {
        status: CompanyUserStatus.DELETED,
      };

      // Mock para findOne
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        id: mockCompanyUser.company_user_id,
        companyId: mockCompanyUser.company_id,
        authId: mockCompanyUser.auth_id,
        email: mockCompanyUser.email,
        fullName: mockCompanyUser.full_name,
        role: mockCompanyUser.role,
        status: CompanyUserStatus.ACTIVE,
        metadata: mockCompanyUser.metadata,
        createdAt: mockCompanyUser.created_at,
        updatedAt: mockCompanyUser.updated_at,
      });

      // Mock para validateStatusTransition - falla
      jest.spyOn(service as any, 'validateStatusTransition').mockImplementationOnce(() => {
        throw new BadRequestException(`Invalid status transition from ${CompanyUserStatus.ACTIVE} to ${CompanyUserStatus.DELETED}`);
      });

      // Act & Assert
      await expect(
        service.changeStatus(mockCompanyId, mockUserId, statusDto, mockAdminUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // Pruebas para changeRole()
  describe('changeRole', () => {
    it('should change user role successfully', async () => {
      // Arrange
      const roleDto: ChangeUserRoleDto = {
        role: CompanyUserRole.ADMIN,
      };

      // Mock para el usuario actual
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: mockCompanyUser, error: null });
          })
        };
      });

      // Mock para update
      const updatedUser = {
        ...mockCompanyUser,
        role: CompanyUserRole.ADMIN,
        updated_at: '2023-01-02T00:00:00Z',
      };
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: updatedUser, error: null });
          })
        };
      });

      // Act
      const result = await service.changeRole(
        mockCompanyId,
        mockUserId,
        roleDto,
        mockAdminUserId,
      );

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('company_user');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(result.role).toBe(CompanyUserRole.ADMIN);
    });

    it('should throw ForbiddenException when trying to change role of a deleted user', async () => {
      // Arrange
      const roleDto: ChangeUserRoleDto = {
        role: CompanyUserRole.ADMIN,
      };

      // Mock para el usuario actual - usuario eliminado
      const deletedUser = {
        ...mockCompanyUser,
        status: CompanyUserStatus.DELETED,
      };
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: deletedUser, error: null });
          })
        };
      });

      // Act & Assert
      await expect(
        service.changeRole(mockCompanyId, mockUserId, roleDto, mockAdminUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const roleDto: ChangeUserRoleDto = {
        role: CompanyUserRole.ADMIN,
      };

      // Mock para findOne - usuario no encontrado
      mockSupabaseClient.single.mockImplementation(() => {
        return {
          then: jest.fn().mockImplementation(callback => {
            return callback({ data: null, error: { message: 'No rows found' } });
          })
        };
      });

      // Act & Assert
      await expect(
        service.changeRole(mockCompanyId, 'non-existent-user', roleDto, mockAdminUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para remove()
  describe('remove', () => {
    it('should mark a user as deleted successfully', async () => {
      // Arrange
      // Mock para findOne
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockResolvedValueOnce({
        id: mockCompanyUser.company_user_id,
        companyId: mockCompanyUser.company_id,
        authId: mockCompanyUser.auth_id,
        email: mockCompanyUser.email,
        fullName: mockCompanyUser.full_name,
        role: mockCompanyUser.role,
        status: CompanyUserStatus.ACTIVE,
        metadata: mockCompanyUser.metadata,
        createdAt: mockCompanyUser.created_at,
        updatedAt: mockCompanyUser.updated_at,
      });

      // Mock para changeStatus (se llamará desde remove)
      const deletedUser = {
        ...mockCompanyUser,
        status: CompanyUserStatus.DELETED,
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      // Mock del método changeStatus
      jest.spyOn(service, 'changeStatus').mockResolvedValueOnce({
        id: deletedUser.company_user_id,
        companyId: deletedUser.company_id,
        authId: deletedUser.auth_id,
        email: deletedUser.email,
        fullName: deletedUser.full_name,
        role: deletedUser.role,
        status: deletedUser.status,
        metadata: deletedUser.metadata,
        createdAt: deletedUser.created_at,
        updatedAt: deletedUser.updated_at,
      });

      // Act
      const result = await service.remove(mockCompanyId, mockUserId, mockAdminUserId);

      // Assert
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(result.status).toBe(CompanyUserStatus.DELETED);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      // Mock para findOne que lanza NotFoundException
      const mockFindOne = jest.spyOn(service, 'findOne');
      mockFindOne.mockRejectedValueOnce(
        new NotFoundException(`Company user with ID non-existent-user not found or inaccessible`)
      );

      // Act & Assert
      await expect(
        service.remove(mockCompanyId, 'non-existent-user', mockAdminUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is already deleted', async () => {
      // Arrange
      // Mock para findOne que devuelve un usuario ya eliminado
      const mockFindOne = jest.spyOn(service, 'findOne');
      const deletedUser = {
        id: mockCompanyUser.company_user_id,
        companyId: mockCompanyUser.company_id,
        authId: mockCompanyUser.auth_id,
        email: mockCompanyUser.email,
        fullName: mockCompanyUser.full_name,
        role: mockCompanyUser.role,
        status: CompanyUserStatus.DELETED,
        metadata: mockCompanyUser.metadata,
        createdAt: mockCompanyUser.created_at,
        updatedAt: mockCompanyUser.updated_at,
      };
      mockFindOne.mockResolvedValueOnce(deletedUser);

      // Act & Assert
      await expect(
        service.remove(mockCompanyId, mockUserId, mockAdminUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
