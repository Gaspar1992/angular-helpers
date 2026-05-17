import { InjectionToken } from '@angular/core';

export interface StorageTransport {
  /**
   * Lee un valor persistido asíncronamente
   */
  read<T>(key: string, useToon?: boolean): Promise<T | undefined>;

  /**
   * Escribe un valor persistido asíncronamente
   */
  write<T>(key: string, data: T, useToon?: boolean): Promise<void>;

  /**
   * Elimina un valor persistido
   */
  delete(key: string): Promise<void>;

  /**
   * Suscribe un callback para cambios externos (sincronización multi-pestaña)
   * Devuelve una función para des-suscribirse.
   */
  onChange?<T>(key: string, callback: (value: T) => void): () => void;
}

/**
 * Token de inyección para el Transporte de Almacenamiento activo
 */
export const STORAGE_TRANSPORT = new InjectionToken<StorageTransport>('STORAGE_TRANSPORT');
