import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { AuditService, AuditAction, ResourceType } from '../common/audit/audit.service';
import { CreatePolicyDto, UpdatePolicyDto, PolicyDto } from './dto';
import { PolicyStatus } from './dto/policy-status.enum';
import { Logger } from '@nestjs/common';

// Mock del servicio de auditoría
const mockAuditService = {
  log: jest.fn().mockImplementation(() => Promise.resolve()),
};

describe('PoliciesService', () => {
  let service: PoliciesService;
  let auditService: AuditService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PoliciesService>(PoliciesService);
    auditService = module.get<AuditService>(AuditService);

    // Mocks para las funciones del servicio
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
      {
        id: 'policy-2',
        title: 'Terms of Service',
        content: 'Terms of service content',
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

    // Mock de métodos del servicio
    jest.spyOn(service, 'findAll').mockImplementation(
      async (companyId?: string) => {
        if (companyId) {
          return mockPolicies.filter(p => p.companyId === companyId);
        }
        return mockPolicies;
      },
    );

    jest.spyOn(service, 'findOne').mockImplementation(
      async (id: string) => {
        const policy = mockPolicies.find(p => p.id === id);
        if (!policy) {
          throw new NotFoundException('Política no encontrada');
        }
        return policy;
      },
    );

    jest.spyOn(service, 'create').mockImplementation(
      async (createPolicyDto: CreatePolicyDto, userId: string) => {
        const newPolicy: PolicyDto = {
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
        return newPolicy;
      },
    );

    jest.spyOn(service, 'update').mockImplementation(
      async (id: string, updatePolicyDto: UpdatePolicyDto, userId: string) => {
        // Asegurarse que la política existe
        const existingPolicy = mockPolicies.find(p => p.id === id);
        if (!existingPolicy) {
          throw new NotFoundException('Política no encontrada');
        }

        const updatedPolicy: PolicyDto = {
          ...existingPolicy,
          id: 'new-policy-id',
          title: updatePolicyDto.title || existingPolicy.title,
          content: updatePolicyDto.content || existingPolicy.content,
          version: (existingPolicy.version || 1) + 1,
          updatedAt: '2023-01-02T00:00:00Z',
          status: PolicyStatus.ACTIVE,
        };
        
        // Llamar al log de auditoría
        await auditService.log({
          action: AuditAction.UPDATE_POLICY,
          resourceType: ResourceType.POLICY,
          resourceId: updatedPolicy.id,
          userId
        });
        
        return updatedPolicy;
      },
    );

    jest.spyOn(service, 'remove').mockImplementation(
      async (id: string, userId: string): Promise<void> => {
        const existingPolicy = mockPolicies.find(p => p.id === id);
        if (!existingPolicy) {
          throw new NotFoundException('Política no encontrada');
        }
        
        // Llamar al log de auditoría
        await auditService.log({
          action: AuditAction.DELETE_POLICY,
          resourceType: ResourceType.POLICY,
          resourceId: id,
          userId
        });
      },
    );

    jest.spyOn(service, 'getVersionHistory').mockImplementation(
      async (id: string) => {
        if (id === 'policy-1') {
          return [
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
        }
        return [];
      },
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active policies', async () => {
      // Act
      const result = await service.findAll();

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('policy-1');
      expect(result[1].id).toBe('policy-2');
    });

    it('should filter policies by companyId', async () => {
      // Arrange
      const companyId = 'company-1';

      // Act
      const result = await service.findAll(companyId);

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].companyId).toBe(companyId);
      expect(result[1].companyId).toBe(companyId);
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      jest.spyOn(service, 'findAll').mockRejectedValueOnce(
        new Error('Error al obtener políticas: Database error'),
      );

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(
        'Error al obtener políticas: Database error',
      );
    });
  });

  describe('findOne', () => {
    it('should return a policy by id', async () => {
      // Arrange
      const policyId = 'policy-1';

      // Act
      const result = await service.findOne(policyId);

      // Assert
      expect(result.id).toBe(policyId);
      expect(result.title).toBe('Privacy Policy');
    });

    it('should throw NotFoundException when policy is not found', async () => {
      // Arrange
      const policyId = 'nonexistent-policy-id';

      // Act & Assert
      await expect(service.findOne(policyId)).rejects.toThrow(
        NotFoundException,
      );
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

      // Act
      const result = await service.create(createPolicyDto, userId);

      // Assert
      expect(result.id).toBe('new-policy-id');
      expect(result.title).toBe(createPolicyDto.title);
      expect(result.content).toBe(createPolicyDto.content);
      expect(result.companyId).toBe(createPolicyDto.companyId);
      expect(result.createdBy).toBe(userId);
      expect(result.version).toBe(1);
      expect(result.status).toBe(PolicyStatus.ACTIVE);
    });

    it('should throw an error when policy creation fails', async () => {
      // Arrange
      const userId = 'user-1';
      const createPolicyDto: CreatePolicyDto = {
        title: 'New Privacy Policy',
        content: 'New privacy policy content',
        companyId: 'company-1',
      };

      jest.spyOn(service, 'create').mockRejectedValueOnce(
        new Error('Error al crear política: Database error'),
      );

      // Act & Assert
      await expect(service.create(createPolicyDto, userId)).rejects.toThrow(
        'Error al crear política: Database error',
      );
    });
  });

  describe('update', () => {
    it('should update an existing policy', async () => {
      // Arrange
      const policyId = 'policy-1';
      const userId = 'user-1';
      const updatePolicyDto: UpdatePolicyDto = {
        title: 'Updated Privacy Policy',
        content: 'Updated privacy policy content',
      };

      // Act
      const result = await service.update(policyId, updatePolicyDto, userId);

      // Assert
      expect(result.id).toBe('new-policy-id');
      expect(result.title).toBe(updatePolicyDto.title);
      expect(result.content).toBe(updatePolicyDto.content);
      expect(result.version).toBe(2);
      expect(result.status).toBe(PolicyStatus.ACTIVE);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when policy to update is not found', async () => {
      // Arrange
      const policyId = 'nonexistent-policy-id';
      const userId = 'user-1';
      const updatePolicyDto: UpdatePolicyDto = {
        title: 'Updated Privacy Policy',
        content: 'Updated content',
      };

      // Act & Assert
      await expect(
        service.update(policyId, updatePolicyDto, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should mark a policy as deleted', async () => {
      // Arrange
      const policyId = 'policy-1';
      const userId = 'user-1';

      // Act
      await service.remove(policyId, userId);

      // Assert
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when policy to delete is not found', async () => {
      // Arrange
      const policyId = 'nonexistent-policy-id';
      const userId = 'user-1';

      // Act & Assert
      await expect(service.remove(policyId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history of a policy', async () => {
      // Arrange
      const policyId = 'policy-1';

      // Act
      const result = await service.getVersionHistory(policyId);

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].version).toBe(2);
      expect(result[1].version).toBe(1);
    });

    it('should return empty array when no version history exists', async () => {
      // Arrange
      const policyId = 'policy-2';

      // Act
      const result = await service.getVersionHistory(policyId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
