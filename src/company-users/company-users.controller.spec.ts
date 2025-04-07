import { Test, TestingModule } from '@nestjs/testing';
import { CompanyUsersController } from './company-users.controller';
import { CompanyUsersService } from './company-users.service';
import { 
  CompanyUserDto, 
  CreateCompanyUserDto, 
  UpdateCompanyUserDto,
  ChangeUserStatusDto,
  ChangeUserRoleDto,
  CompanyUserStatus,
  CompanyUserRole
} from './dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../users/enums/user-role.enum';

describe('CompanyUsersController', () => {
  let controller: CompanyUsersController;
  let service: CompanyUsersService;

  // Mock data
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockAdminId = 'admin-123';

  const mockCompanyUser: CompanyUserDto = {
    id: mockUserId,
    companyId: mockCompanyId,
    authId: 'auth-123',
    fullName: 'Test User',
    email: 'test@example.com',
    role: CompanyUserRole.OPERATOR,
    status: CompanyUserStatus.ACTIVE,
    metadata: { department: 'IT' },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockCreateDto: CreateCompanyUserDto = {
    email: 'new@example.com',
    fullName: 'New User',
    role: CompanyUserRole.OPERATOR,
    authId: 'auth-456',
    metadata: { department: 'Sales' }
  };

  const mockUpdateDto: UpdateCompanyUserDto = {
    fullName: 'Updated User',
    metadata: { department: 'Marketing' }
  };

  const mockStatusDto: ChangeUserStatusDto = {
    status: CompanyUserStatus.SUSPENDED
  };

  const mockRoleDto: ChangeUserRoleDto = {
    role: CompanyUserRole.MANAGER
  };

  // Setup mock service
  const mockCompanyUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateSelfProfile: jest.fn(),
    changeStatus: jest.fn(),
    changeRole: jest.fn(),
    getActivity: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyUsersController],
      providers: [
        {
          provide: CompanyUsersService,
          useValue: mockCompanyUsersService,
        },
      ],
    }).compile();

    controller = module.get<CompanyUsersController>(CompanyUsersController);
    service = module.get<CompanyUsersService>(CompanyUsersService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new company user', async () => {
      // Arrange
      mockCompanyUsersService.create.mockResolvedValue(mockCompanyUser);

      // Act
      const result = await controller.create(mockCompanyId, mockCreateDto, mockAdminId);

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        mockCompanyId, 
        mockCreateDto, 
        mockAdminId
      );
      expect(result).toEqual(mockCompanyUser);
    });

    it('should handle service errors when creating user', async () => {
      // Arrange
      const errorMessage = 'Error creating user';
      mockCompanyUsersService.create.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.create(mockCompanyId, mockCreateDto, mockAdminId)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('findAll', () => {
    it('should return all company users', async () => {
      // Arrange
      const mockUsers = [mockCompanyUser];
      mockCompanyUsersService.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await controller.findAll(mockCompanyId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockCompanyId, undefined);
      expect(result).toEqual(mockUsers);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      // Arrange
      const mockUsers = [mockCompanyUser];
      mockCompanyUsersService.findAll.mockResolvedValue(mockUsers);
      const includeDeleted = true;

      // Act
      const result = await controller.findAll(mockCompanyId, includeDeleted);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(mockCompanyId, includeDeleted);
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockCompanyUsersService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll(mockCompanyId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a specific company user', async () => {
      // Arrange
      mockCompanyUsersService.findOne.mockResolvedValue(mockCompanyUser);

      // Act
      const result = await controller.findOne(mockCompanyId, mockUserId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(mockCompanyId, mockUserId, undefined);
      expect(result).toEqual(mockCompanyUser);
    });

    it('should handle not found errors', async () => {
      // Arrange
      const errorMessage = `User with ID ${mockUserId} not found in company ${mockCompanyId}`;
      mockCompanyUsersService.findOne.mockRejectedValue(new NotFoundException(errorMessage));

      // Act & Assert
      await expect(
        controller.findOne(mockCompanyId, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a company user', async () => {
      // Arrange
      const updatedUser = {...mockCompanyUser, ...mockUpdateDto};
      mockCompanyUsersService.update.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.update(
        mockCompanyId,
        mockUserId,
        mockUpdateDto,
        mockAdminId
      );

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        mockUpdateDto,
        mockAdminId
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateSelf', () => {
    it('should allow users to update their own profile', async () => {
      // Arrange
      const updatedUser = {...mockCompanyUser, ...mockUpdateDto};
      mockCompanyUsersService.updateSelfProfile.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.updateSelf(
        mockCompanyId,
        mockUserId,
        mockUpdateDto,
        mockUserId // Same user ID
      );

      // Assert
      expect(service.updateSelfProfile).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        mockUpdateDto
      );
      expect(result).toEqual(updatedUser);
    });

    it('should reject updates from different users', async () => {
      // Act & Assert
      await expect(
        controller.updateSelf(
          mockCompanyId,
          mockUserId,
          mockUpdateDto,
          'different-user-id' // Different user ID
        )
      ).rejects.toThrow(ForbiddenException);
      
      expect(service.updateSelfProfile).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('should change user status', async () => {
      // Arrange
      const statusChangedUser = {
        ...mockCompanyUser,
        status: mockStatusDto.status
      };
      mockCompanyUsersService.changeStatus.mockResolvedValue(statusChangedUser);

      // Act
      const result = await controller.changeStatus(
        mockCompanyId,
        mockUserId,
        mockStatusDto,
        mockAdminId
      );

      // Assert
      expect(service.changeStatus).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        mockStatusDto,
        mockAdminId
      );
      expect(result).toEqual(statusChangedUser);
      expect(result.status).toEqual(CompanyUserStatus.SUSPENDED);
    });
  });

  describe('changeRole', () => {
    it('should change user role', async () => {
      // Arrange
      const roleChangedUser = {
        ...mockCompanyUser,
        role: mockRoleDto.role
      };
      mockCompanyUsersService.changeRole.mockResolvedValue(roleChangedUser);

      // Act
      const result = await controller.changeRole(
        mockCompanyId,
        mockUserId,
        mockRoleDto,
        mockAdminId
      );

      // Assert
      expect(service.changeRole).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        mockRoleDto,
        mockAdminId
      );
      expect(result).toEqual(roleChangedUser);
      expect(result.role).toEqual(CompanyUserRole.MANAGER);
    });
  });

  describe('getActivity', () => {
    it('should return user activity history', async () => {
      // Arrange
      const mockActivity = {
        userId: mockUserId,
        actions: [
          { action: 'login', timestamp: '2023-01-01T00:00:00Z' },
          { action: 'update_profile', timestamp: '2023-01-02T00:00:00Z' }
        ]
      };
      mockCompanyUsersService.getActivity.mockResolvedValue(mockActivity);

      // Act
      const result = await controller.getActivity(
        mockCompanyId,
        mockUserId,
        mockAdminId
      );

      // Assert
      expect(service.getActivity).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        mockAdminId
      );
      expect(result).toEqual(mockActivity);
    });
  });

  describe('remove', () => {
    it('should delete a company user', async () => {
      // Arrange
      mockCompanyUsersService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(mockCompanyId, mockUserId, mockAdminId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        mockAdminId
      );
    });

    it('should handle not found errors during removal', async () => {
      // Arrange
      const errorMessage = `User with ID ${mockUserId} not found in company ${mockCompanyId}`;
      mockCompanyUsersService.remove.mockRejectedValue(new NotFoundException(errorMessage));

      // Act & Assert
      await expect(
        controller.remove(mockCompanyId, mockUserId, mockAdminId)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
