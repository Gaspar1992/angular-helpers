import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export type ConnectionType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';

export interface NetworkInformation {
  type?: ConnectionType;
  effectiveType?: EffectiveConnectionType;
  downlink?: number;
  downlinkMax?: number;
  rtt?: number;
  saveData?: boolean;
  online: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationAPI;
  mozConnection?: NetworkInformationAPI;
  webkitConnection?: NetworkInformationAPI;
}

interface NetworkInformationAPI extends EventTarget {
  type?: ConnectionType;
  effectiveType?: EffectiveConnectionType;
  downlink?: number;
  downlinkMax?: number;
  rtt?: number;
  saveData?: boolean;
}

@Injectable()
export class NetworkInformationService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const nav = navigator as NavigatorWithConnection;
    return 'connection' in nav || 'mozConnection' in nav || 'webkitConnection' in nav;
  }

  private getConnection(): NetworkInformationAPI | undefined {
    const nav = navigator as NavigatorWithConnection;
    return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  }

  getSnapshot(): NetworkInformation {
    const online = isPlatformBrowser(this.platformId) ? navigator.onLine : true;
    const conn = this.getConnection();

    return {
      online,
      type: conn?.type,
      effectiveType: conn?.effectiveType,
      downlink: conn?.downlink,
      downlinkMax: conn?.downlinkMax,
      rtt: conn?.rtt,
      saveData: conn?.saveData,
    };
  }

  watch(): Observable<NetworkInformation> {
    return new Observable<NetworkInformation>((observer) => {
      if (!isPlatformBrowser(this.platformId)) {
        observer.next({ online: true });
        observer.complete();
        return undefined;
      }

      const emit = () => observer.next(this.getSnapshot());

      const conn = this.getConnection();
      if (conn) {
        conn.addEventListener('change', emit);
      }
      window.addEventListener('online', emit);
      window.addEventListener('offline', emit);

      emit();

      const cleanup = () => {
        conn?.removeEventListener('change', emit);
        window.removeEventListener('online', emit);
        window.removeEventListener('offline', emit);
      };

      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }

  get isOnline(): boolean {
    return isPlatformBrowser(this.platformId) ? navigator.onLine : true;
  }
}
