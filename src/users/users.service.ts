import { Injectable, NotFoundException } from '@nestjs/common';
import { createSupabaseClient } from '../config/supabase.config';
import { UpdateUserDto, UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private supabase = createSupabaseClient();
  private supabaseAdmin = createSupabaseClient({ useServiceKey: true });

  /**
   * Obtiene el perfil del usuario actual
   */
  async getCurrentUser(userId: string): Promise<UserDto> {
    // Obtenemos los datos de autenticación
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.getUserById(
      userId,
    );

    if (authError || !authData.user) {
      throw new NotFoundException(`Usuario no encontrado: ${authError?.message}`);
    }

    // Creamos el objeto de usuario con los datos de autenticación
    const userData: UserDto = {
      id: authData.user.id,
      email: authData.user.email || '',
      name: authData.user.user_metadata?.name || 'Usuario',
      created_at: authData.user.created_at || new Date().toISOString(),
      updated_at: authData.user.updated_at || new Date().toISOString(),
    };

    return userData;
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const updates: any = { ...updateUserDto };
    
    // Si se actualiza el email, lo hacemos a través de la API de autenticación
    if (updates.email) {
      const { error: authError } = await this.supabaseAdmin.auth.admin.updateUserById(userId, {
        email: updates.email,
      });

      if (authError) {
        throw new Error(`Error al actualizar email: ${authError.message}`);
      }
    }

    // Si se actualiza el nombre, lo hacemos a través de la API de autenticación
    if (updates.name) {
      const { error: metadataError } = await this.supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { name: updates.name },
      });

      if (metadataError) {
        throw new Error(`Error al actualizar nombre: ${metadataError.message}`);
      }
    }

    // Devolvemos el usuario actualizado
    return this.getCurrentUser(userId);
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(userId: string): Promise<{ success: boolean }> {
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }

    return { success: true };
  }
}
