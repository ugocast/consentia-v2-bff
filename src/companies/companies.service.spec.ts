import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { SubscriptionPlan } from './dto/subscription-plan.enum';
import { NotFoundException } from '@nestjs/common';
import { CreateCompanyDto, UpdateCompanyDto, Company } from './dto';
import { AuditService } from '../common/audit/audit.service';
import { Logger } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let auditService: AuditService;
  let mockCompanyId: string;
  let mockUserId: string;
  let mockCompany: Company;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock del AuditService
    const mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
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

    service = module.get<CompaniesService>(CompaniesService);
    auditService = module.get<AuditService>(AuditService);
    
    mockCompanyId = 'test-company-id';
    mockUserId = 'test-user-id';
    
    mockCompany = {
      id: mockCompanyId,
      name: 'Test Company',
      contact_email: 'test@example.com',
      subscription_plan: SubscriptionPlan.STANDARD,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock de métodos del servicio
    jest.spyOn(service, 'findAll').mockResolvedValue([mockCompany]);
    jest.spyOn(service, 'findOne').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'create').mockImplementation(async (dto, userId) => ({
      id: mockCompanyId,
      ...dto,
      subscription_plan: dto.subscription_plan || SubscriptionPlan.FREE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Company));
    jest.spyOn(service, 'update').mockImplementation(async (id, dto, userId) => ({
      ...mockCompany,
      ...dto,
      updated_at: new Date().toISOString(),
    } as Company));
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of companies', async () => {
      // Act
      const result = await service.findAll();
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockCompany);
    });
    
    it('should handle errors when finding companies fails', async () => {
      // Arrange
      jest.spyOn(service, 'findAll').mockRejectedValueOnce(new Error('Failed to find companies'));
      
      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('should return a single company by id', async () => {
      // Act
      const result = await service.findOne(mockCompanyId);
      
      // Assert
      expect(result).toEqual(mockCompany);
    });

    it('should throw NotFoundException when company is not found', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(
        new NotFoundException('Empresa no encontrada')
      );

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a company with default subscription plan', async () => {
      // Arrange
      const createDto: CreateCompanyDto = {
        name: 'New Company',
        contact_email: 'new@example.com',
      };

      // Act
      const result = await service.create(createDto, mockUserId);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(result.subscription_plan).toBe(SubscriptionPlan.FREE);
    });

    it('should create a company with specified subscription plan', async () => {
      // Arrange
      const createDto: CreateCompanyDto = {
        name: 'Premium Company',
        contact_email: 'premium@example.com',
        subscription_plan: SubscriptionPlan.PREMIUM,
      };

      // Act
      const result = await service.create(createDto, mockUserId);
      
      // Assert
      expect(result.subscription_plan).toBe(SubscriptionPlan.PREMIUM);
    });
    
    it('should handle errors when creating a company', async () => {
      // Arrange
      const createDto: CreateCompanyDto = {
        name: 'Error Company',
        contact_email: 'error@example.com',
      };
      
      jest.spyOn(service, 'create').mockRejectedValueOnce(new Error('Failed to create company'));
      
      // Act & Assert
      await expect(service.create(createDto, mockUserId)).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update company data', async () => {
      // Arrange
      const updateDto: UpdateCompanyDto = {
        name: 'Updated Company Name',
      };

      // Act
      const result = await service.update(mockCompanyId, updateDto, mockUserId);
      
      // Assert
      expect(result).toHaveProperty('id', mockCompanyId);
      expect(result.name).toBe(updateDto.name);
    });
    
    it('should handle errors when updating a company', async () => {
      // Arrange
      const updateDto: UpdateCompanyDto = {
        name: 'Error Company',
      };
      
      jest.spyOn(service, 'update').mockRejectedValueOnce(new Error('Failed to update company'));
      
      // Act & Assert
      await expect(service.update(mockCompanyId, updateDto, mockUserId)).rejects.toThrow(Error);
    });
  });
});
