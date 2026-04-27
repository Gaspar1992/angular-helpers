// OlZoneHelper unit tests
import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, NgZone, runInInjectionContext } from '@angular/core';
import { OlZoneHelper } from './zone-helper.service';

describe('OlZoneHelper', () => {
  it('runs callbacks directly when NgZone is not available (zoneless)', () => {
    const injector = Injector.create({ providers: [] });
    const helper = runInInjectionContext(injector, () => new OlZoneHelper());

    const fn = vi.fn(() => 42);
    expect(helper.runOutsideAngular(fn)).toBe(42);
    expect(helper.runInsideAngular(fn)).toBe(42);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('delegates to NgZone.runOutsideAngular and NgZone.run when NgZone is provided', () => {
    const ngZone = {
      runOutsideAngular: vi.fn(<T>(f: () => T) => f()),
      run: vi.fn(<T>(f: () => T) => f()),
    };
    const injector = Injector.create({ providers: [{ provide: NgZone, useValue: ngZone }] });
    const helper = runInInjectionContext(injector, () => new OlZoneHelper());

    const fn = vi.fn(() => 'ok');
    expect(helper.runOutsideAngular(fn)).toBe('ok');
    expect(helper.runInsideAngular(fn)).toBe('ok');
    expect(ngZone.runOutsideAngular).toHaveBeenCalledOnce();
    expect(ngZone.run).toHaveBeenCalledOnce();
  });
});
