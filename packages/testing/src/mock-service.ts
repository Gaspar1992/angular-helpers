import { Provider, Type } from '@angular/core';
import { vi } from 'vitest';

/**
 * Provides a mock for an Angular service.
 * Automatically spies on all methods defined on the service's prototype using Vitest.
 *
 * @param type The service class to mock.
 * @param mockOverrides Optional overrides for the mock instance.
 * @returns An Angular Provider object.
 */
export function provideMockService<T>(type: Type<T>, mockOverrides?: Partial<T>): Provider {
  const mock: any = { ...mockOverrides };

  const proto = type.prototype;
  if (proto) {
    Object.getOwnPropertyNames(proto).forEach((prop) => {
      if (prop !== 'constructor' && typeof proto[prop] === 'function' && !mock[prop]) {
        mock[prop] = vi.fn();
      }
    });
  }

  return {
    provide: type,
    useValue: mock,
  };
}
