import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { OlTimeService } from './time.service';
import { OlZoneHelper } from './zone-helper.service';

describe('OlTimeService', () => {
  let service: OlTimeService;
  let zoneHelper: OlZoneHelper;

  beforeEach(() => {
    vi.useFakeTimers();
    zoneHelper = {
      runOutsideAngular: (fn: () => void) => fn(),
      runInsideAngular: (fn: () => void) => fn(),
    } as unknown as OlZoneHelper;

    const injector = Injector.create({
      providers: [OlTimeService, { provide: OlZoneHelper, useValue: zoneHelper }],
    });

    service = runInInjectionContext(injector, () => injector.get(OlTimeService));
  });

  afterEach(() => {
    service.pause();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    expect(service.isPlaying()).toBe(false);
    expect(service.speed()).toBe(1);
    expect(typeof service.currentTime()).toBe('number');
  });

  it('should update time when setTime is called', () => {
    const timestamp = 1700000000000;
    service.setTime(timestamp);
    expect(service.currentTime()).toBe(timestamp);
  });

  it('should update speed when setSpeed is called', () => {
    service.setSpeed(10);
    expect(service.speed()).toBe(10);
  });

  it('should advance time on play() and requestAnimationFrame loop', () => {
    const startTime = 100000;
    service.setTime(startTime);
    service.setSpeed(2);

    let rafCallback: ((time: number) => void) | null = null;
    let frameId = 1;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return frameId++;
    });
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    service.play();
    expect(service.isPlaying()).toBe(true);

    // If play is called again while playing, should be a no-op
    service.play();
    expect(service.isPlaying()).toBe(true);

    // Simulate RAF tick with 50ms delta
    if (rafCallback) {
      (rafCallback as any)(50);
    }

    expect(service.currentTime()).toBe(startTime + 50 * 2);

    // Pause animation
    service.pause();
    expect(service.isPlaying()).toBe(false);
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should stop animation and reset time', () => {
    service.setTime(5000);
    service.stop(1000);

    expect(service.isPlaying()).toBe(false);
    expect(service.currentTime()).toBe(1000);
  });

  it('should stop and reset to default Date.now() when stop has no args', () => {
    const now = 1720000000000;
    vi.setSystemTime(now);
    service.stop();
    expect(service.currentTime()).toBe(now);
  });
});
