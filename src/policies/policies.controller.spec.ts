import { Test, TestingModule } from '@nestjs/testing';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto, UpdatePolicyDto, PolicyDto } from './dto';
import { PolicyStatus } from './dto/policy-status.enum';

// Mock del servicio de políticas
const mockPoliciesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getVersionHistory: jest.fn(),
};

describe('PoliciesController', () => {
  let controller: PoliciesController;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoliciesController],
      providers: [
        {
          provide: PoliciesService,
          useValue: mockPoliciesService,
        },
      ],
    }).compile();

    controller = module.get<PoliciesController>(PoliciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all policies', async () => {
      // Arrange
      const mockPolicies: PolicyDto[] = [
        {
          id: 'policy-1',
          title: 'Privacy Policy',
          content: 'Privacy policy content',
          version: 1,
          company_id: 'company-1',
          created_by: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          valid_from: '2023-01-01T00:00:00Z',
          valid_to: null,
          status: PolicyStatus.ACTIVE,
        },
      ];

      mockPoliciesService.findAll.mockResolvedValue(mockPolicies);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockPoliciesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPolicies);
    });

    it('should filter policies by company_id', async () => {
      // Arrange
      const companyId = 'company-1';
      const mockPolicies: PolicyDto[] = [
        {
          id: 'policy-1',
          title: 'Privacy Policy',
          content: 'Privacy policy content',
          version: 1,
          company_id: companyId,
          created_by: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          valid_from: '2023-01-01T00:00:00Z',
          valid_to: null,
          status: PolicyStatus.ACTIVE,
        },
      ];

      mockPoliciesService.findAll.mockResolvedValue(mockPolicies);

      // Act
      const result = await controller.findAll(companyId);

      // Assert
      expect(mockPoliciesService.findAll).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(mockPolicies);
    });
  });

  describe('findOne', () => {
    it('should return a policy by id', async () => {
      // Arrange
      const policyId = 'policy-1';
      const mockPolicy: PolicyDto = {
        id: policyId,
        title: 'Privacy Policy',
        content: 'Privacy policy content',
        version: 1,
        company_id: 'company-1',
        created_by: 'user-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        valid_from: '2023-01-01T00:00:00Z',
        valid_to: null,
        status: PolicyStatus.ACTIVE,
      };

      mockPoliciesService.findOne.mockResolvedValue(mockPolicy);

      // Act
      const result = await controller.findOne(policyId);

      // Assert
      expect(mockPoliciesService.findOne).toHaveBeenCalledWith(policyId);
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('create', () => {
    it('should create a new policy', async () => {
      // Arrange
      const createPolicyDto: CreatePolicyDto = {
        title: 'New Privacy Policy',
        content: 'New privacy policy content',
        companyId: 'company-1',
      };

      const mockRequest = {
        user: {
          id: 'user-1',
        },
      };

      const mockCreatedPolicy: PolicyDto = {
        id: 'new-policy-id',
        title: createPolicyDto.title,
        content: createPolicyDto.content,
        version: 1,
        company_id: createPolicyDto.companyId,
        created_by: mockRequest.user.id,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        valid_from: '2023-01-01T00:00:00Z',
        valid_to: null,
        status: PolicyStatus.ACTIVE,
      };

      mockPoliciesService.create.mockResolvedValue(mockCreatedPolicy);

      // Act
      const result = await controller.create(
        createPolicyDto,
        mockRequest as any,
      );

      // Assert
      expect(mockPoliciesService.create).toHaveBeenCalledWith(
        createPolicyDto,
        mockRequest.user.id,
      );
      expect(result).toEqual(mockCreatedPolicy);
    });
  });

  describe('update', () => {
    it('should update an existing policy', async () => {
      // Arrange
      const policyId = 'policy-1';
      const updatePolicyDto: UpdatePolicyDto = {
        title: 'Updated Privacy Policy',
      };

      const mockRequest = {
        user: {
          id: 'user-1',
        },
      };

      const mockUpdatedPolicy: PolicyDto = {
        id: policyId,
        title: updatePolicyDto.title,
        content: 'Privacy policy content',
        version: 2,
        company_id: 'company-1',
        created_by: mockRequest.user.id,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        valid_from: '2023-01-02T00:00:00Z',
        valid_to: null,
        status: PolicyStatus.ACTIVE,
      };

      mockPoliciesService.update.mockResolvedValue(mockUpdatedPolicy);

      // Act
      const result = await controller.update(
        policyId,
        updatePolicyDto,
        mockRequest as any,
      );

      // Assert
      expect(mockPoliciesService.update).toHaveBeenCalledWith(
        policyId,
        updatePolicyDto,
        mockRequest.user.id,
      );
      expect(result).toEqual(mockUpdatedPolicy);
    });
  });

  describe('remove', () => {
    it('should delete a policy', async () => {
      // Arrange
      const policyId = 'policy-1';
      const mockRequest = {
        user: {
          id: 'user-1',
        },
      };

      const mockResult = { success: true };

      mockPoliciesService.remove.mockResolvedValue(mockResult);

      // Act
      const result = await controller.remove(policyId, mockRequest as any);

      // Assert
      expect(mockPoliciesService.remove).toHaveBeenCalledWith(
        policyId,
        mockRequest.user.id,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history of a policy', async () => {
      // Arrange
      const policyId = 'policy-1';
      const mockVersions: PolicyDto[] = [
        {
          id: 'policy-1-v2',
          title: 'Privacy Policy v2',
          content: 'Updated privacy policy content',
          version: 2,
          company_id: 'company-1',
          created_by: 'user-1',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          valid_from: '2023-01-02T00:00:00Z',
          valid_to: null,
          status: PolicyStatus.ACTIVE,
        },
        {
          id: 'policy-1-v1',
          title: 'Privacy Policy v1',
          content: 'Original privacy policy content',
          version: 1,
          company_id: 'company-1',
          created_by: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          valid_from: '2023-01-01T00:00:00Z',
          valid_to: '2023-01-02T00:00:00Z',
          status: PolicyStatus.INACTIVE,
        },
      ];

      mockPoliciesService.getVersionHistory.mockResolvedValue(mockVersions);

      // Act
      const result = await controller.getVersionHistory(policyId);

      // Assert
      expect(mockPoliciesService.getVersionHistory).toHaveBeenCalledWith(
        policyId,
      );
      expect(result).toEqual(mockVersions);
    });
  });
});
