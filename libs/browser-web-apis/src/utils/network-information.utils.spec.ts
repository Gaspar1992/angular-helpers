import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom, take } from 'rxjs';
import {
  isNetworkInformationSupported,
  getNetworkConnection,
  getNetworkSnapshot,
  networkInformationStream,
} from './network-information.utils';

describe('network-information.utils', () => {
  let mockConn: any;

  beforeEach(() => {
    mockConn = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      downlinkMax: 100,
      rtt: 50,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      onLine: true,
      connection: mockConn,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect network information support', () => {
    expect(isNetworkInformationSupported()).toBe(true);
    expect(getNetworkConnection()).toBe(mockConn);

    vi.stubGlobal('navigator', {});
    expect(isNetworkInformationSupported()).toBe(false);
    expect(getNetworkConnection()).toBeUndefined();
  });

  it('should get network snapshot', () => {
    const snap = getNetworkSnapshot();
    expect(snap).toEqual({
      online: true,
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      downlinkMax: 100,
      rtt: 50,
      saveData: false,
    });
  });

  it('should stream network changes', async () => {
    const stream$ = networkInformationStream();
    const snap = await firstValueFrom(stream$.pipe(take(1)));
    expect(snap.online).toBe(true);

    const sub = stream$.subscribe();
    sub.unsubscribe();
    expect(mockConn.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
