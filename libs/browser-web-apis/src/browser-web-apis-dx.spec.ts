import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import {
  DeviceMotionService,
  DeviceOrientationService,
  injectFullscreen,
  injectNotifications,
  injectWebShare,
} from './public-api';

describe('Browser Web APIs DX (T2)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('DeviceMotionService and DeviceOrientationService work without NgZone in zoneless mode', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), DeviceMotionService, DeviceOrientationService],
    });

    const motion = TestBed.inject(DeviceMotionService);
    const orientation = TestBed.inject(DeviceOrientationService);

    expect(motion).toBeTruthy();
    expect(orientation).toBeTruthy();
  });

  it('injectFullscreen, injectNotifications, and injectWebShare expose signal refs safely', () => {
    @Component({ template: '' })
    class SensorCmp {
      fullscreen = injectFullscreen();
      notifications = injectNotifications();
      share = injectWebShare();
    }

    TestBed.configureTestingModule({
      imports: [SensorCmp],
      providers: [provideZonelessChangeDetection()],
    });

    const fixture = TestBed.createComponent(SensorCmp);
    const cmp = fixture.componentInstance;

    expect(typeof cmp.fullscreen.isSupported()).toBe('boolean');
    expect(cmp.fullscreen.isFullscreen()).toBe(false);
    expect(typeof cmp.notifications.isSupported()).toBe('boolean');
    expect(['default', 'granted', 'denied']).toContain(cmp.notifications.permission());
    expect(typeof cmp.share.isSupported()).toBe('boolean');
    expect(cmp.share.isSharing()).toBe(false);
    expect(cmp.share.lastError()).toBeNull();
  });
});
