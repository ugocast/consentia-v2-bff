import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createSupabaseClient } from '../../config/supabase.config';
import { v4 as uuidv4 } from 'uuid';
import { AuditService, AuditAction, ResourceType } from '../audit/audit.service';
import { ApiKeyDto, CreateApiKeyDto, ApiKeyStatus } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  /**
   * Crea una nueva clave API
   * @param createApiKeyDto Datos para crear la clave API
   * @param userId ID del usuario que crea la clave
   * @returns La clave API creada
   */
  async createApiKey(createApiKeyDto: CreateApiKeyDto, userId: string): Promise<ApiKeyDto> {
    // Validar los datos de entrada
    if (!createApiKeyDto.name || createApiKeyDto.name.trim() === '') {
      throw new BadRequestException('El nombre de la clave API es requerido');
    }

    try {
      const supabase = createSupabaseClient();
      
      // Generar una clave API segura
      const apiKeyValue = this.generateApiKey();
      
      // Crear la clave en la base de datos
      const { data, error } = await supabase
        .from('api_key')
        .insert({
          id: uuidv4(),
          name: createApiKeyDto.name,
          key: apiKeyValue,
          company_id: createApiKeyDto.companyId,
          created_by: userId,
          status: ApiKeyStatus.ACTIVE,
          expires_at: createApiKeyDto.expiresAt,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error al crear clave API: ${error.message}`);
      }

      // Registrar evento de auditoría
      await this.auditService.log({
        action: AuditAction.CREATE,
        resourceType: ResourceType.SYSTEM,
        resourceId: data.id,
        userId,
        metadata: {
          companyId: createApiKeyDto.companyId,
          name: createApiKeyDto.name,
        },
      });

      // Mapear a DTO
      return this.mapToDto(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todas las claves API para una empresa
   * @param companyId ID de la empresa
   * @returns Lista de claves API
   */
  async getApiKeys(companyId: string): Promise<ApiKeyDto[]> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('api_key')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error al obtener claves API: ${error.message}`);
      }

      // Mapear a DTOs sin incluir el valor de la clave
      return data.map(apiKey => this.mapToDto(apiKey, true));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una clave API por su ID
   * @param id ID de la clave API
   * @param companyId ID de la empresa
   * @returns La clave API encontrada
   */
  async getApiKeyById(id: string, companyId: string): Promise<ApiKeyDto> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('api_key')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .single();

      if (error || !data) {
        throw new NotFoundException(`API key with id ${id} not found`);
      }

      // Mapear a DTO sin incluir el valor de la clave
      return this.mapToDto(data, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valida una clave API
   * @param apiKey Valor de la clave API a validar
   * @returns Datos de la clave API si es válida
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyDto> {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('api_key')
        .select('*')
        .eq('key', apiKey)
        .single();

      if (error || !data) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Verificar si la clave está activa
      if (data.status !== ApiKeyStatus.ACTIVE) {
        throw new UnauthorizedException('API key is not active');
      }

      // Verificar si la clave no ha expirado
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Actualizar el estado a expirado
        await this.updateKeyStatus(data.id, ApiKeyStatus.EXPIRED);
        throw new UnauthorizedException('API key has expired');
      }

      return this.mapToDto(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoca una clave API
   * @param id ID de la clave API
   * @param companyId ID de la empresa
   * @param userId ID del usuario que revoca la clave
   * @returns La clave API revocada
   */
  async revokeApiKey(id: string, companyId: string, userId: string): Promise<ApiKeyDto> {
    // Verificar que la clave existe
    await this.getApiKeyById(id, companyId);

    try {
      const supabase = createSupabaseClient();
      
      // Actualizar el estado de la clave
      const { data, error } = await supabase
        .from('api_key')
        .update({
          status: ApiKeyStatus.REVOKED,
        })
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Error al revocar clave API: ${error.message}`);
      }

      // Registrar evento de auditoría
      await this.auditService.log({
        action: AuditAction.UPDATE,
        resourceType: ResourceType.SYSTEM,
        resourceId: id,
        userId,
        metadata: {
          companyId,
          status: ApiKeyStatus.REVOKED,
        },
      });

      // Mapear a DTO
      return this.mapToDto(data, true);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el estado de una clave API
   * @param id ID de la clave API
   * @param status Nuevo estado
   * @returns Resultado de la operación
   */
  private async updateKeyStatus(id: string, status: ApiKeyStatus): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('api_key')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw new Error(`Error al actualizar estado de clave API: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Genera una clave API segura
   * @returns Clave API generada
   */
  private generateApiKey(): string {
    // Prefijo para indicar que es una clave API
    const prefix = 'pk_';
    
    // Generar 32 bytes de datos aleatorios y convertirlos a base64
    const randomBytes = crypto.randomBytes(32).toString('base64');
    
    // Eliminar caracteres no alfanuméricos y limitar longitud
    const cleanedKey = randomBytes.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
    
    return `${prefix}${cleanedKey}`;
  }

  /**
   * Mapea un registro de la base de datos a un DTO
   * @param data Datos de la clave API
   * @param hideKey Indica si se debe ocultar el valor de la clave
   * @returns DTO de clave API
   */
  private mapToDto(data: any, hideKey = false): ApiKeyDto {
    return {
      id: data.id,
      name: data.name,
      key: hideKey ? undefined : data.key,
      companyId: data.company_id,
      createdBy: data.created_by,
      status: data.status,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    };
  }
} 