import { Observable, of } from 'rxjs';

import {
  type ConnectionType,
  type EffectiveConnectionType,
  type NetworkInformation,
} from '../services/network-information.service';

export type { ConnectionType, EffectiveConnectionType, NetworkInformation };

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

export function isNetworkInformationSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as NavigatorWithConnection;
  return 'connection' in nav || 'mozConnection' in nav || 'webkitConnection' in nav;
}

export function getNetworkConnection(): NetworkInformationAPI | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as NavigatorWithConnection;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

export function getNetworkSnapshot(): NetworkInformation {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const conn = getNetworkConnection();
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

export function networkInformationStream(): Observable<NetworkInformation> {
  if (typeof window === 'undefined') {
    return of({ online: true });
  }

  return new Observable<NetworkInformation>((observer) => {
    const emit = () => observer.next(getNetworkSnapshot());
    const conn = getNetworkConnection();

    if (conn) conn.addEventListener('change', emit);
    window.addEventListener('online', emit);
    window.addEventListener('offline', emit);

    emit();

    return () => {
      conn?.removeEventListener('change', emit);
      window.removeEventListener('online', emit);
      window.removeEventListener('offline', emit);
    };
  });
}
