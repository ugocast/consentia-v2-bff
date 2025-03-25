import { SubscriptionPlan } from './subscription-plan.enum';
import { CompanyStatus } from './company-status.enum';

/**
 * Interfaz que representa una empresa en el sistema.
 */
export interface Company {
  /**
   * Identificador único de la empresa.
   */
  id: string;
  
  /**
   * Nombre de la empresa.
   */
  name: string;
  
  /**
   * Descripción de la empresa (opcional).
   */
  description?: string;
  
  /**
   * Email de contacto de la empresa.
   */
  contact_email: string;
  
  /**
   * Teléfono de contacto (opcional).
   */
  phone?: string;
  
  /**
   * Dirección de la empresa (opcional).
   */
  address?: string;
  
  /**
   * Estado actual de la empresa.
   */
  status: CompanyStatus;
  
  /**
   * Plan de suscripción actual.
   */
  subscription_plan: SubscriptionPlan;
  
  /**
   * Metadatos adicionales de la empresa.
   */
  metadata?: Record<string, any>;
  
  /**
   * Configuraciones de la empresa.
   */
  config?: {
    /**
     * Configuración de notificaciones.
     */
    notification_settings?: {
      email_notifications: boolean;
      sms_notifications: boolean;
      notification_frequency: string;
    };
    
    /**
     * Configuración de privacidad.
     */
    privacy_settings?: {
      data_retention_period: number;
      allow_data_sharing: boolean;
      require_explicit_consent: boolean;
    };
    
    /**
     * Configuración de marca.
     */
    branding_settings?: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
    };
  };
  
  /**
   * Detalles de la suscripción.
   */
  subscription_details?: {
    start_date?: string;
    end_date?: string;
    billing_details?: {
      payment_method: string;
      billing_email: string;
      billing_address: string;
    };
  };
  
  /**
   * Fecha de creación.
   */
  created_at: string;
  
  /**
   * Fecha de última actualización.
   */
  updated_at: string;
} 