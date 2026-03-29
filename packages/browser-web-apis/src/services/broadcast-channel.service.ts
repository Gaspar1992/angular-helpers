import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable()
export class BroadcastChannelService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private channels = new Map<string, BroadcastChannel>();

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'BroadcastChannel' in window;
  }

  private ensureSupport(): void {
    if (!this.isSupported()) {
      throw new Error('BroadcastChannel API not supported in this environment');
    }
  }

  open<T = unknown>(name: string): Observable<T> {
    this.ensureSupport();

    return new Observable<T>((observer) => {
      let channel = this.channels.get(name);
      if (!channel) {
        channel = new BroadcastChannel(name);
        this.channels.set(name, channel);
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
    this.ensureSupport();

    let channel = this.channels.get(name);
    if (!channel) {
      channel = new BroadcastChannel(name);
      this.channels.set(name, channel);
      this.destroyRef.onDestroy(() => this.close(name));
    }

    channel.postMessage(data);
  }

  close(name: string): void {
    const channel = this.channels.get(name);
    if (channel) {
      channel.close();
      this.channels.delete(name);
    }
  }

  closeAll(): void {
    this.channels.forEach((channel) => channel.close());
    this.channels.clear();
  }

  getOpenChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}
