import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './browser-api-base.service';

/**
 * Base class for services that manage a named registry of persistent
 * connections (e.g. BroadcastChannel, EventSource, WebSocket pools).
 *
 * Implements the Template Method pattern: subclasses define how a single
 * native connection is closed via `closeNativeConnection()`, while this
 * class handles the Map lifecycle (remove, closeAll, getActiveKeys).
 *
 * Public-facing method names (`close`, `disconnect`, `getOpenChannels`, etc.)
 * remain the responsibility of the concrete service to preserve the public API.
 */
@Injectable()
export abstract class ConnectionRegistryBaseService<T> extends BrowserApiBaseService {
  protected readonly connections = new Map<string, T>();

  /**
   * Template Method: close a single native connection.
   * Implemented by each concrete service.
   */
  protected abstract closeNativeConnection(connection: T): void;

  /**
   * Remove and close the connection registered under `key`.
   * Safe to call even if the key does not exist.
   */
  protected removeConnection(key: string): void {
    const connection = this.connections.get(key);
    if (connection) {
      this.closeNativeConnection(connection);
      this.connections.delete(key);
    }
  }

  /**
   * Close all registered connections and clear the registry.
   */
  protected closeAllConnections(): void {
    this.connections.forEach((connection) => this.closeNativeConnection(connection));
    this.connections.clear();
  }

  /**
   * Return the keys of all currently open connections.
   */
  protected getConnectionKeys(): string[] {
    return Array.from(this.connections.keys());
  }
}
