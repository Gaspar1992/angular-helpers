import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import {
  getNetworkSnapshot,
  isNetworkInformationSupported,
  networkInformationStream,
} from '../utils/network-information.utils';

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

@Injectable({ providedIn: 'root' })
export class NetworkInformationService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && isNetworkInformationSupported();
  }

  getSnapshot(): NetworkInformation {
    return isPlatformBrowser(this.platformId) ? getNetworkSnapshot() : { online: true };
  }

  watch(): Observable<NetworkInformation> {
    return networkInformationStream();
  }

  get isOnline(): boolean {
    return isPlatformBrowser(this.platformId) ? navigator.onLine : true;
  }
}
