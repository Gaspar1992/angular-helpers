import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { WebTransportService } from '../services/web-transport.service';

export const WEB_TRANSPORT_SUPPORTED = new InjectionToken<boolean>('WEB_TRANSPORT_SUPPORTED', {
  providedIn: 'root',
  factory: () => typeof globalThis !== 'undefined' && 'WebTransport' in globalThis,
});

export const WEB_TRANSPORT_TOKEN = new InjectionToken<any>('WEB_TRANSPORT_TOKEN', {
  providedIn: 'root',
  factory: () =>
    typeof globalThis !== 'undefined' && 'WebTransport' in globalThis
      ? (globalThis as any).WebTransport
      : null,
});

export function provideWebTransport(): EnvironmentProviders {
  return makeEnvironmentProviders([WebTransportService]);
}
