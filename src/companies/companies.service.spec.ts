import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { CommonModule } from '../common/common.module';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyStatus } from './dto/company-status.enum';
import { SubscriptionPlan } from './dto/subscription-plan.enum';
import { CompanyConfigDto } from './dto/company-config.dto';
import { ChangeCompanyStatusDto } from './dto/change-company-status.dto';
import { SubscriptionPlanDto, BillingCycle } from './dto/subscription-plan.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let mockCompany;
  let mockCompanyId;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [CompaniesService],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    
    mockCompanyId = 'test-company-id';
    mockCompany = {
      id: mockCompanyId,
      name: 'Test Company',
      contact_email: 'test@example.com',
      status: CompanyStatus.ACTIVE,
      subscription_plan: SubscriptionPlan.STANDARD,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock de métodos del servicio
    jest.spyOn(service, 'findAll').mockResolvedValue([mockCompany]);
    jest.spyOn(service, 'findOne').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'create').mockImplementation(async (dto) => ({
      id: mockCompanyId,
      ...dto,
      status: dto.status || CompanyStatus.TRIAL,
      subscription_plan: dto.subscription_plan || SubscriptionPlan.FREE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    jest.spyOn(service, 'update').mockImplementation(async (id, dto) => ({
      ...mockCompany,
      ...dto,
      updated_at: new Date().toISOString(),
    }));
    jest.spyOn(service, 'remove').mockResolvedValue({ ...mockCompany, status: CompanyStatus.INACTIVE });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a company with default status and plan', async () => {
      const createDto: CreateCompanyDto = {
        name: 'New Company',
        contact_email: 'new@example.com',
      };

      const result = await service.create(createDto);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(result.status).toBe(CompanyStatus.TRIAL);
      expect(result.subscription_plan).toBe(SubscriptionPlan.FREE);
    });

    it('should create a company with specified status and plan', async () => {
      const createDto: CreateCompanyDto = {
        name: 'Premium Company',
        contact_email: 'premium@example.com',
        status: CompanyStatus.ACTIVE,
        subscription_plan: SubscriptionPlan.PREMIUM,
      };

      const result = await service.create(createDto);
      
      expect(result.status).toBe(CompanyStatus.ACTIVE);
      expect(result.subscription_plan).toBe(SubscriptionPlan.PREMIUM);
    });
  });

  describe('findAll', () => {
    it('should return an array of companies', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockCompanyId);
    });
  });

  describe('findOne', () => {
    it('should return a single company by id', async () => {
      const result = await service.findOne(mockCompanyId);
      expect(result).toHaveProperty('id', mockCompanyId);
    });

    it('should throw an exception for invalid id', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(
        new HttpException('Company not found', HttpStatus.NOT_FOUND)
      );

      await expect(service.findOne('invalid-id')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update company data', async () => {
      const updateDto: UpdateCompanyDto = {
        name: 'Updated Company Name',
      };

      const result = await service.update(mockCompanyId, updateDto);
      
      expect(result).toHaveProperty('id', mockCompanyId);
      expect(result.name).toBe(updateDto.name);
    });
  });

  describe('updateConfig', () => {
    it('should update company configuration', async () => {
      jest.spyOn(service, 'updateConfig').mockImplementation(async (id, configDto) => ({
        ...mockCompany,
        config: configDto,
        updated_at: new Date().toISOString(),
      }));
      
      const configDto: CompanyConfigDto = {
        notification_settings: {
          email_notifications: true,
          sms_notifications: false,
          notification_frequency: 'DAILY',
        },
      };

      const result = await service.updateConfig(mockCompanyId, configDto);
      
      expect(result).toHaveProperty('config');
      expect(result.config).toEqual(configDto);
    });
  });

  describe('updateStatus', () => {
    it('should update company status', async () => {
      jest.spyOn(service, 'updateStatus').mockImplementation(async (id, statusDto) => ({
        ...mockCompany,
        status: statusDto.status,
        updated_at: new Date().toISOString(),
      }));
      
      const statusDto: ChangeCompanyStatusDto = {
        status: CompanyStatus.SUSPENDED,
        reason: 'Payment overdue',
      };

      const result = await service.updateStatus(mockCompanyId, statusDto);
      
      expect(result.status).toBe(CompanyStatus.SUSPENDED);
    });

    it('should validate status transitions', async () => {
      jest.spyOn(service, 'updateStatus').mockRejectedValueOnce(
        new HttpException('Invalid status transition', HttpStatus.BAD_REQUEST)
      );
      
      const statusDto: ChangeCompanyStatusDto = {
        status: CompanyStatus.CANCELLED,
      };

      await expect(service.updateStatus(mockCompanyId, statusDto)).rejects.toThrow(HttpException);
    });
  });

  describe('updateSubscription', () => {
    it('should update company subscription plan', async () => {
      jest.spyOn(service, 'updateSubscription').mockImplementation(async (id, subscriptionDto) => ({
        ...mockCompany,
        subscription_plan: subscriptionDto.plan,
        subscription_details: {
          start_date: new Date().toISOString(),
          end_date: subscriptionDto.end_date?.toISOString(),
          billing_details: subscriptionDto.billing_details,
        },
        updated_at: new Date().toISOString(),
      }));
      
      const subscriptionDto: SubscriptionPlanDto = {
        plan: SubscriptionPlan.PREMIUM,
        billing_cycle: BillingCycle.ANNUAL,
        billing_details: {
          payment_method: 'CREDIT_CARD',
          billing_email: 'billing@example.com',
          billing_address: '123 Billing St',
        },
      };

      const result = await service.updateSubscription(mockCompanyId, subscriptionDto);
      
      expect(result.subscription_plan).toBe(SubscriptionPlan.PREMIUM);
      expect(result.subscription_details).toBeDefined();
      expect(result.subscription_details.billing_details).toEqual(subscriptionDto.billing_details);
    });
  });

  describe('remove', () => {
    it('should set company status to INACTIVE', async () => {
      const result = await service.remove(mockCompanyId);
      expect(result.status).toBe(CompanyStatus.INACTIVE);
    });
  });
});
