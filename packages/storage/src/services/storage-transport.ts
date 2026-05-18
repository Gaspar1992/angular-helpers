import { InjectionToken } from '@angular/core';
import { StorageSignalOptions } from '../interfaces/storage.types';

export interface StorageTransport {
  /**
   * Lee un valor persistido asíncronamente
   */
  read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined>;

  /**
   * Escribe un valor persistido asíncronamente
   */
  write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void>;

  /**
   * Elimina un valor persistido
   */
  delete(key: string, options?: StorageSignalOptions): Promise<void>;

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
