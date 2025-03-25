import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import {
  AuditService,
  AuditAction,
  ResourceType,
} from '../common/audit/audit.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyConfigDto,
  SubscriptionPlanDto,
  SubscriptionPlan,
  Company,
} from './dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);
  private supabase = createSupabaseClient({ useServiceKey: true });

  constructor(private readonly auditService: AuditService) {}

  // Métodos de validación
  private validateConfig(config: CompanyConfigDto): void {
    if (config.notification_settings) {
      if (config.notification_settings.notification_frequency && !this.isValidFrequency(config.notification_settings.notification_frequency)) {
        throw new BadRequestException('La frecuencia de notificación no es válida');
      }
    }

    if (config.privacy_settings) {
      if (config.privacy_settings.data_retention_period < 30) {
        throw new BadRequestException('El período de retención de datos debe ser al menos de 30 días');
      }
      if (config.privacy_settings.data_retention_period > 365) {
        throw new BadRequestException('El período de retención de datos no puede exceder 365 días');
      }
    }

    if (config.branding_settings) {
      if (config.branding_settings.primary_color && !this.isValidHexColor(config.branding_settings.primary_color)) {
        throw new BadRequestException('El color primario debe ser un código hexadecimal válido');
      }
      if (config.branding_settings.secondary_color && !this.isValidHexColor(config.branding_settings.secondary_color)) {
        throw new BadRequestException('El color secundario debe ser un código hexadecimal válido');
      }
      if (config.branding_settings.logo_url && !this.isValidUrl(config.branding_settings.logo_url)) {
        throw new BadRequestException('La URL del logo no es válida');
      }
    }
  }

  private validateSubscription(subscription: SubscriptionPlanDto): void {
    if (subscription.start_date && subscription.end_date) {
      const startDate = new Date(subscription.start_date);
      const endDate = new Date(subscription.end_date);
      if (startDate >= endDate) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    if (subscription.billing_details) {
      if (!this.isValidEmail(subscription.billing_details.billing_email)) {
        throw new BadRequestException('El email de facturación no es válido');
      }
      if (!this.isValidPaymentMethod(subscription.billing_details.payment_method)) {
        throw new BadRequestException('El método de pago no es válido');
      }
      if (!this.isValidAddress(subscription.billing_details.billing_address)) {
        throw new BadRequestException('La dirección de facturación no es válida');
      }
    }
  }

  // Métodos de utilidad
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidHexColor(color: string): boolean {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidFrequency(frequency: string): boolean {
    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly'];
    return validFrequencies.includes(frequency.toLowerCase());
  }

  private isValidPaymentMethod(paymentMethod: string): boolean {
    const validMethods = ['credit_card', 'bank_transfer', 'paypal'];
    return validMethods.includes(paymentMethod.toLowerCase());
  }

  private isValidAddress(address: string): boolean {
    return address.length >= 10 && address.length <= 200;
  }

  // Métodos de suscripción
  private getPlanLimits(plan: SubscriptionPlan) {
    const limits = {
      [SubscriptionPlan.FREE]: {
        users: 5,
        consents: 100,
        storage_gb: 1,
        operations_per_day: 1000,
      },
      [SubscriptionPlan.STANDARD]: {
        users: 20,
        consents: 1000,
        storage_gb: 10,
        operations_per_day: 10000,
      },
      [SubscriptionPlan.PREMIUM]: {
        users: 100,
        consents: 10000,
        storage_gb: 100,
        operations_per_day: 100000,
      },
    };
    return limits[plan];
  }

  /**
   * Obtiene todas las empresas
   * @returns Lista de empresas
   */
  async findAll(): Promise<Company[]> {
    try {
      const { data, error } = await this.supabase
        .from('company')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error al obtener empresas: ${error.message}`, error);
        throw new Error(`Error al obtener empresas: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Error al obtener empresas', error);
      throw error;
    }
  }

  /**
   * Obtiene una empresa por su ID
   * @param id ID de la empresa
   * @returns Empresa encontrada
   */
  async findOne(id: string): Promise<Company> {
    try {
      const { data, error } = await this.supabase
        .from('company')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logger.error(`Empresa no encontrada: ${error?.message}`);
        throw new NotFoundException('Empresa no encontrada');
      }

      return data;
    } catch (error) {
      this.logger.error(`Error al obtener empresa: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva empresa
   * @param createCompanyDto Datos para crear la empresa
   * @param userId ID del usuario que crea la empresa
   * @returns Empresa creada
   */
  async create(
    createCompanyDto: CreateCompanyDto,
    userId: string,
  ): Promise<Company> {
    try {
      const { data, error } = await this.supabase
        .from('company')
        .insert({
          ...createCompanyDto,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        this.logger.error(`Error al crear empresa: ${error.message}`, error);
        throw new Error(`Error al crear empresa: ${error.message}`);
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.CREATE_COMPANY,
        resourceType: ResourceType.COMPANY,
        resourceId: data.id,
        userId,
        metadata: {
          name: data.name,
        },
      });

      return data;
    } catch (error) {
      this.logger.error('Error al crear empresa', error);
      throw error;
    }
  }

  /**
   * Actualiza una empresa
   * @param id ID de la empresa
   * @param updateCompanyDto Datos para actualizar la empresa
   * @param userId ID del usuario que actualiza la empresa
   * @returns Empresa actualizada
   */
  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
  ): Promise<Company> {
    try {
      const { data, error } = await this.supabase
        .from('company')
        .update({
          ...updateCompanyDto,
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error al actualizar empresa: ${error.message}`, error);
        throw new Error(`Error al actualizar empresa: ${error.message}`);
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE_COMPANY,
        resourceType: ResourceType.COMPANY,
        resourceId: id,
        userId,
        metadata: {
          name: data.name,
        },
      });

      return data;
    } catch (error) {
      this.logger.error('Error al actualizar empresa', error);
      throw error;
    }
  }

  /**
   * Actualiza la configuración de una empresa
   * @param id ID de la empresa
   * @param configDto Datos de configuración
   * @param userId ID del usuario que actualiza la configuración
   * @returns Empresa actualizada
   */
  async updateConfig(
    id: string,
    configDto: CompanyConfigDto,
    userId: string,
  ): Promise<Company> {
    try {
      // Validar la configuración antes de actualizar
      this.validateConfig(configDto);

      const { data, error } = await this.supabase
        .from('company')
        .update({
          config: configDto,
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(
          `Error al actualizar configuración: ${error.message}`,
          error,
        );
        throw new Error(`Error al actualizar configuración: ${error.message}`);
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE_COMPANY_CONFIG,
        resourceType: ResourceType.COMPANY,
        resourceId: id,
        userId,
        metadata: {
          name: data.name,
        },
      });

      return data;
    } catch (error) {
      this.logger.error('Error al actualizar configuración', error);
      throw error;
    }
  }

  /**
   * Actualiza el plan de suscripción de una empresa
   * @param id ID de la empresa
   * @param subscriptionDto Datos de suscripción
   * @param userId ID del usuario que actualiza la suscripción
   * @returns Empresa actualizada
   */
  async updateSubscription(
    id: string,
    subscriptionDto: SubscriptionPlanDto,
    userId: string,
  ): Promise<Company> {
    try {
      // Validar la suscripción antes de actualizar
      this.validateSubscription(subscriptionDto);

      const { data, error } = await this.supabase
        .from('company')
        .update({
          subscription_plan: subscriptionDto.plan,
          subscription_details: {
            start_date: subscriptionDto.start_date,
            end_date: subscriptionDto.end_date,
            billing_details: subscriptionDto.billing_details,
          },
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error(
          `Error al actualizar suscripción: ${error.message}`,
          error,
        );
        throw new Error(`Error al actualizar suscripción: ${error.message}`);
      }

      // Registrar la acción en el log de auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE_COMPANY_SUBSCRIPTION,
        resourceType: ResourceType.COMPANY,
        resourceId: id,
        userId,
        metadata: {
          name: data.name,
          plan: subscriptionDto.plan,
        },
      });

      return data;
    } catch (error) {
      this.logger.error('Error al actualizar suscripción', error);
      throw error;
    }
  }

  /**
   * Obtiene la configuración de una empresa
   * @param id ID de la empresa
   * @returns Configuración de la empresa
   */
  async getConfig(id: string): Promise<CompanyConfigDto> {
    try {
      const { data, error } = await this.supabase
        .from('company')
        .select('config')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logger.error(`Empresa no encontrada: ${error?.message}`);
        throw new NotFoundException('Empresa no encontrada');
      }

      return data.config;
    } catch (error) {
      this.logger.error(`Error al obtener configuración: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Obtiene la suscripción de una empresa
   * @param id ID de la empresa
   * @returns Detalles de la suscripción
   */
  async getSubscription(id: string): Promise<SubscriptionPlanDto> {
    try {
      const { data, error } = await this.supabase
        .from('company')
        .select('subscription_plan, subscription_details')
        .eq('id', id)
        .single();

      if (error || !data) {
        this.logger.error(`Empresa no encontrada: ${error?.message}`);
        throw new NotFoundException('Empresa no encontrada');
      }

      return {
        plan: data.subscription_plan,
        start_date: data.subscription_details?.start_date,
        end_date: data.subscription_details?.end_date,
        billing_details: data.subscription_details?.billing_details,
      };
    } catch (error) {
      this.logger.error(`Error al obtener suscripción: ${error.message}`, error);
      throw error;
    }
  }
}
