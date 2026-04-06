import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectionRegistryBaseService } from './base/connection-registry-base.service';

@Injectable()
export class BroadcastChannelService extends ConnectionRegistryBaseService<BroadcastChannel> {
  protected override getApiName(): string {
    return 'broadcast-channel';
  }

  protected override closeNativeConnection(channel: BroadcastChannel): void {
    channel.close();
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'BroadcastChannel' in window;
  }

  private ensureBroadcastChannelSupported(): void {
    if (!this.isSupported()) {
      throw new Error('BroadcastChannel API not supported in this environment');
    }
  }

  open<T = unknown>(name: string): Observable<T> {
    this.ensureBroadcastChannelSupported();

    return new Observable<T>((observer) => {
      let channel = this.connections.get(name);
      if (!channel) {
        channel = new BroadcastChannel(name);
        this.connections.set(name, channel);
      }

      const handler = (event: MessageEvent<T>) => observer.next(event.data);
      const errorHandler = () => observer.error(new Error(`BroadcastChannel "${name}" error`));

      channel.addEventListener('message', handler);
      channel.addEventListener('messageerror', errorHandler);

      const cleanup = () => {
        channel!.removeEventListener('message', handler);
        channel!.removeEventListener('messageerror', errorHandler);
      };

      this.destroyRef.onDestroy(() => this.close(name));

      return cleanup;
    });
  }

  post<T = unknown>(name: string, data: T): void {
    this.ensureBroadcastChannelSupported();

    let channel = this.connections.get(name);
    if (!channel) {
      channel = new BroadcastChannel(name);
      this.connections.set(name, channel);
      this.destroyRef.onDestroy(() => this.close(name));
    }

    channel.postMessage(data);
  }

  close(name: string): void {
    this.removeConnection(name);
  }

  closeAll(): void {
    this.closeAllConnections();
  }

  getOpenChannels(): string[] {
    return this.getConnectionKeys();
  }
}
