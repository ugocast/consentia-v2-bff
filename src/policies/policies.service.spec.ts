import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { AuditService } from '../common/audit/audit.service';
import {
  mockSupabaseClient,
  mockCreateSupabaseClient,
} from '../common/mocks/supabase.mock';
import { CreatePolicyDto, UpdatePolicyDto, PolicyDto } from './dto';
import { PolicyStatus } from './dto/policy-status.enum';

// Mock del servicio de auditoría
const mockAuditService = {
  log: jest.fn().mockImplementation(() => Promise.resolve()),
};

// Mock del módulo de configuración de Supabase
jest.mock('../config/supabase.config', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('PoliciesService', () => {
  let service: PoliciesService;

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();

    // Configurar el mock para devolver el cliente de Supabase
    mockCreateSupabaseClient.mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<PoliciesService>(PoliciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active policies', async () => {
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
        {
          id: 'policy-2',
          title: 'Terms of Service',
          content: 'Terms of service content',
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

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.then = jest.fn().mockResolvedValue({
        data: mockPolicies,
        error: null,
      });

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('valid_to', null);
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

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.then = jest.fn().mockResolvedValue({
        data: mockPolicies,
        error: null,
      });

      // Act
      const result = await service.findAll(companyId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('valid_to', null);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'company_id',
        companyId,
      );
      expect(result).toEqual(mockPolicies);
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.then = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

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

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: mockPolicy,
        error: null,
      });

      // Act
      const result = await service.findOne(policyId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', policyId);
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('valid_to', null);
      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException when policy is not found', async () => {
      // Arrange
      const policyId = 'nonexistent-policy-id';

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Policy not found' },
      });

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
        company_id: 'company-1',
      };

      const mockCreatedPolicy: PolicyDto = {
        id: 'new-policy-id',
        title: createPolicyDto.title,
        content: createPolicyDto.content,
        version: 1,
        company_id: createPolicyDto.company_id,
        created_by: userId,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        valid_from: '2023-01-01T00:00:00Z',
        valid_to: null,
        status: PolicyStatus.ACTIVE,
      };

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: mockCreatedPolicy,
        error: null,
      });

      // Act
      const result = await service.create(createPolicyDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createPolicyDto.title,
          content: createPolicyDto.content,
          company_id: createPolicyDto.company_id,
          created_by: userId,
        }),
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedPolicy);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw an error when policy creation fails', async () => {
      // Arrange
      const userId = 'user-1';
      const createPolicyDto: CreatePolicyDto = {
        title: 'New Privacy Policy',
        content: 'New privacy policy content',
        company_id: 'company-1',
      };

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

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

      const mockExistingPolicy: PolicyDto = {
        id: policyId,
        title: 'Privacy Policy',
        content: 'Privacy policy content',
        version: 1,
        company_id: 'company-1',
        created_by: userId,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        valid_from: '2023-01-01T00:00:00Z',
        valid_to: null,
        status: PolicyStatus.ACTIVE,
      };

      const mockUpdatedPolicy: PolicyDto = {
        ...mockExistingPolicy,
        id: 'new-policy-id',
        title: updatePolicyDto.title,
        content: updatePolicyDto.content,
        version: 2,
        updated_at: '2023-01-02T00:00:00Z',
        status: PolicyStatus.ACTIVE,
      };

      // Mock para obtener la política existente
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest
        .fn()
        .mockResolvedValueOnce({
          data: mockExistingPolicy,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockUpdatedPolicy,
          error: null,
        });

      // Mock para actualizar la política existente
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);

      // Mock para insertar la nueva versión
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);

      // Act
      const result = await service.update(policyId, updatePolicyDto, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', policyId);
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('valid_to', null);

      // Verificar que se actualizó la política existente
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          valid_to: expect.any(String),
        }),
      );

      // Verificar que se insertó la nueva versión
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updatePolicyDto.title,
          content: updatePolicyDto.content,
          version: 2,
          company_id: mockExistingPolicy.company_id,
          created_by: userId,
        }),
      );

      expect(result).toEqual(mockUpdatedPolicy);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when policy to update is not found', async () => {
      // Arrange
      const policyId = 'nonexistent-policy-id';
      const userId = 'user-1';
      const updatePolicyDto: UpdatePolicyDto = {
        title: 'Updated Privacy Policy',
      };

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Policy not found' },
      });

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

      const mockExistingPolicy: PolicyDto = {
        id: policyId,
        title: 'Privacy Policy',
        content: 'Privacy policy content',
        version: 1,
        company_id: 'company-1',
        created_by: userId,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        valid_from: '2023-01-01T00:00:00Z',
        valid_to: null,
        status: PolicyStatus.ACTIVE,
      };

      // Mock para obtener la política existente
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: mockExistingPolicy,
        error: null,
      });

      // Mock para actualizar la política existente
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.then = jest.fn().mockResolvedValue({
        data: { id: policyId },
        error: null,
      });

      // Act
      const result = await service.remove(policyId, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', policyId);
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('valid_to', null);

      // Verificar que se actualizó la política existente
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          valid_to: expect.any(String),
          status: PolicyStatus.DELETED,
        }),
      );

      expect(result).toEqual({ success: true });
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when policy to delete is not found', async () => {
      // Arrange
      const policyId = 'nonexistent-policy-id';
      const userId = 'user-1';

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Policy not found' },
      });

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

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.then = jest.fn().mockResolvedValue({
        data: mockVersions,
        error: null,
      });

      // Act
      const result = await service.getVersionHistory(policyId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('legal_policy');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'previous_version_id',
        policyId,
      );
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('version', {
        ascending: false,
      });
      expect(result).toEqual(mockVersions);
    });

    it('should return empty array when no version history exists', async () => {
      // Arrange
      const policyId = 'policy-1';

      // Mock de la respuesta de Supabase
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.then = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await service.getVersionHistory(policyId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
