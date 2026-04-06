import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

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

@Injectable()
export class NetworkInformationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'network-information';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && isNetworkInformationSupported();
  }

  getSnapshot(): NetworkInformation {
    return this.isBrowserEnvironment() ? getNetworkSnapshot() : { online: true };
  }

  watch(): Observable<NetworkInformation> {
    return networkInformationStream();
  }

  get isOnline(): boolean {
    return this.isBrowserEnvironment() ? navigator.onLine : true;
  }
}
