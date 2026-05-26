import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { injectIdleBatterySaver } from './inject-idle-battery-saver';
import * as visibilityMock from './inject-page-visibility';
import * as batteryMock from './inject-battery';

const mockIsHidden = signal(false);
const mockBatteryInfo = signal<any>({ level: 1.0, charging: true });

vi.spyOn(visibilityMock, 'injectPageVisibility').mockReturnValue({
  state: signal<any>('visible').asReadonly(),
  isVisible: signal(true).asReadonly(),
  isHidden: mockIsHidden.asReadonly(),
});

vi.spyOn(batteryMock, 'injectBattery').mockReturnValue({
  info: mockBatteryInfo.asReadonly(),
  error: signal(null).asReadonly(),
  isSupported: signal(true).asReadonly(),
  refresh: vi.fn(),
});

describe('injectIdleBatterySaver', () => {
  it('should resolve and compute saving state correctly based on visibility', () => {
    mockIsHidden.set(false);
    mockBatteryInfo.set({ level: 0.9, charging: true });

    const saver = injectIdleBatterySaver();
    expect(saver.shouldSaveEnergy()).toBe(false);

    // If page goes hidden, should save energy
    mockIsHidden.set(true);
    expect(saver.shouldSaveEnergy()).toBe(true);
  });

  it('should resolve and compute saving state correctly on low battery', () => {
    mockIsHidden.set(false);

    const saver = injectIdleBatterySaver();

    // If battery is low (< 20%) and discharging (charging = false), should save energy
    mockBatteryInfo.set({ level: 0.15, charging: false });
    expect(saver.isLowBattery()).toBe(true);
    expect(saver.shouldSaveEnergy()).toBe(true);

    // If battery is low but plugged in/charging, should not trigger saving state
    mockBatteryInfo.set({ level: 0.15, charging: true });
    expect(saver.isLowBattery()).toBe(false);
    expect(saver.shouldSaveEnergy()).toBe(false);
  });
});
