import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyStatus } from './dto/company-status.enum';
import { SubscriptionPlan } from './dto/subscription-plan.enum';
import { HttpStatus } from '@nestjs/common';
import { StandardResponseDto } from './dto/standard-response.dto';
import { CompanyConfigDto } from './dto/company-config.dto';
import { ChangeCompanyStatusDto } from './dto/change-company-status.dto';
import { SubscriptionPlanDto } from './dto/subscription-plan.dto';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: CompaniesService;
  let mockCompany;

  beforeEach(async () => {
    // Mock del servicio
    const mockCompaniesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateConfig: jest.fn(),
      updateStatus: jest.fn(),
      updateSubscription: jest.fn(),
      getSubscriptionHistory: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    service = module.get<CompaniesService>(CompaniesService);

    // Datos mock
    mockCompany = {
      id: 'test-id',
      name: 'Test Company',
      contact_email: 'test@example.com',
      status: CompanyStatus.ACTIVE,
      subscription_plan: SubscriptionPlan.STANDARD,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Configurar comportamiento de los mocks
    jest.spyOn(service, 'create').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'findAll').mockResolvedValue([mockCompany]);
    jest.spyOn(service, 'findOne').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'update').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'updateConfig').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'updateStatus').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'updateSubscription').mockResolvedValue(mockCompany);
    jest.spyOn(service, 'getSubscriptionHistory').mockResolvedValue({ subscription_history: [] });
    jest.spyOn(service, 'remove').mockResolvedValue(mockCompany);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a company and return a StandardResponseDto', async () => {
      const createDto: CreateCompanyDto = {
        name: 'New Company',
        contact_email: 'new@example.com',
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('findAll', () => {
    it('should return all companies in a StandardResponseDto', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return one company by id in a StandardResponseDto', async () => {
      const id = 'test-id';
      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('update', () => {
    it('should update a company and return a StandardResponseDto', async () => {
      const id = 'test-id';
      const updateDto: UpdateCompanyDto = {
        name: 'Updated Company',
      };

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('updateConfig', () => {
    it('should update company config and return a StandardResponseDto', async () => {
      const id = 'test-id';
      const configDto: CompanyConfigDto = {
        notification_settings: {
          email_notifications: true,
          sms_notifications: false,
          notification_frequency: 'DAILY',
        },
      };

      const result = await controller.updateConfig(id, configDto);

      expect(service.updateConfig).toHaveBeenCalledWith(id, configDto);
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('updateStatus', () => {
    it('should update company status and return a StandardResponseDto', async () => {
      const id = 'test-id';
      const statusDto: ChangeCompanyStatusDto = {
        status: CompanyStatus.SUSPENDED,
        reason: 'Payment overdue',
      };

      const result = await controller.updateStatus(id, statusDto);

      expect(service.updateStatus).toHaveBeenCalledWith(id, statusDto);
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('updateSubscription', () => {
    it('should update company subscription and return a StandardResponseDto', async () => {
      const id = 'test-id';
      const subscriptionDto: SubscriptionPlanDto = {
        plan: SubscriptionPlan.PREMIUM,
      };

      const result = await controller.updateSubscription(id, subscriptionDto);

      expect(service.updateSubscription).toHaveBeenCalledWith(id, subscriptionDto);
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('remove', () => {
    it('should set company to inactive and return a StandardResponseDto', async () => {
      const id = 'test-id';
      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toBeInstanceOf(StandardResponseDto);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual(mockCompany);
    });
  });
});
