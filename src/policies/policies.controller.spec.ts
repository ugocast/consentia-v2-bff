import { Test, TestingModule } from '@nestjs/testing';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { 
  CreatePolicyDto, 
  UpdatePolicyDto, 
  PolicyDto,
  PolicyCreateResponseDto,
  PolicyVersionResponseDto,
  PolicyDeleteResponseDto
} from './dto';
import { PolicyStatus } from './dto/policy-status.enum';

// Mock del servicio de políticas
const mockPoliciesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findVersions: jest.fn(),
  updateStatus: jest.fn(),
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
          companyId: 'company-1',
          createdBy: 'user-1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          validFrom: '2023-01-01T00:00:00Z',
          validTo: null,
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

    it('should filter policies by companyId', async () => {
      // Arrange
      const companyId = 'company-1';
      const mockPolicies: PolicyDto[] = [
        {
          id: 'policy-1',
          title: 'Privacy Policy',
          content: 'Privacy policy content',
          version: 1,
          companyId: companyId,
          createdBy: 'user-1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          validFrom: '2023-01-01T00:00:00Z',
          validTo: null,
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
        companyId: 'company-1',
        createdBy: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        validFrom: '2023-01-01T00:00:00Z',
        validTo: null,
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
      const userId = 'user-1';
      const createPolicyDto: CreatePolicyDto = {
        title: 'New Privacy Policy',
        content: 'New privacy policy content',
        companyId: 'company-1',
      };

      const mockCreatedPolicy: PolicyDto = {
        id: 'new-policy-id',
        title: createPolicyDto.title,
        content: createPolicyDto.content,
        version: 1,
        companyId: createPolicyDto.companyId,
        createdBy: userId,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        validFrom: '2023-01-01T00:00:00Z',
        validTo: null,
        status: PolicyStatus.ACTIVE,
      };

      const expectedResponse: PolicyCreateResponseDto = {
        message: 'Política legal creada exitosamente',
        id: mockCreatedPolicy.id,
        version: mockCreatedPolicy.version ?? 1,
        validFrom: mockCreatedPolicy.validFrom
      };

      mockPoliciesService.create.mockResolvedValue(mockCreatedPolicy);

      // Act
      const result = await controller.create(createPolicyDto, userId);

      // Assert
      expect(mockPoliciesService.create).toHaveBeenCalledWith(
        createPolicyDto,
        userId,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('update', () => {
    it('should update an existing policy', async () => {
      // Arrange
      const policyId = 'policy-1';
      const userId = 'user-1';
      const updatePolicyDto: UpdatePolicyDto = {
        title: 'Updated Privacy Policy',
        content: 'Updated privacy policy content'
      };

      const mockUpdatedPolicy: PolicyDto = {
        id: 'new-policy-id',
        title: updatePolicyDto.title,
        content: updatePolicyDto.content,
        version: 2,
        companyId: 'company-1',
        createdBy: userId,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        validFrom: '2023-01-02T00:00:00Z',
        validTo: null,
        status: PolicyStatus.ACTIVE,
        previousVersionId: 'policy-1',
      };

      const expectedResponse: PolicyVersionResponseDto = {
        message: 'Nueva versión de política creada exitosamente',
        id: mockUpdatedPolicy.id,
        previousVersionId: mockUpdatedPolicy.previousVersionId || '',
        version: mockUpdatedPolicy.version ?? 1
      };

      mockPoliciesService.update.mockResolvedValue(mockUpdatedPolicy);

      // Act
      const result = await controller.update(policyId, updatePolicyDto, userId);

      // Assert
      expect(mockPoliciesService.update).toHaveBeenCalledWith(
        policyId,
        updatePolicyDto,
        userId,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('remove', () => {
    it('should delete a policy', async () => {
      // Arrange
      const policyId = 'policy-1';
      const userId = 'user-1';

      const expectedResponse: PolicyDeleteResponseDto = {
        message: 'Política eliminada correctamente',
        id: policyId
      };

      mockPoliciesService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(policyId, userId);

      // Assert
      expect(mockPoliciesService.remove).toHaveBeenCalledWith(
        policyId,
        userId,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findVersions', () => {
    it('should return versions of a policy', async () => {
      // Arrange
      const policyId = 'policy-1';
      const mockVersions: PolicyDto[] = [
        {
          id: 'policy-1-v2',
          title: 'Privacy Policy v2',
          content: 'Updated privacy policy content',
          version: 2,
          companyId: 'company-1',
          createdBy: 'user-1',
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          validFrom: '2023-01-02T00:00:00Z',
          validTo: null,
          status: PolicyStatus.ACTIVE,
        },
        {
          id: 'policy-1-v1',
          title: 'Privacy Policy v1',
          content: 'Original privacy policy content',
          version: 1,
          companyId: 'company-1',
          createdBy: 'user-1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          validFrom: '2023-01-01T00:00:00Z',
          validTo: '2023-01-02T00:00:00Z',
          status: PolicyStatus.INACTIVE,
        },
      ];

      mockPoliciesService.findVersions.mockResolvedValue(mockVersions);

      // Act
      const result = await controller.findVersions(policyId);

      // Assert
      expect(mockPoliciesService.findVersions).toHaveBeenCalledWith(
        policyId,
      );
      expect(result).toEqual(mockVersions);
    });
  });
});
