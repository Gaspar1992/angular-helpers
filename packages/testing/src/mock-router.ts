import { Provider } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

/**
 * Provides a mock for the Angular Router with Vitest spies pre-configured
 * for the most common navigation methods.
 *
 * @returns A Provider object ready to be used in TestBed providers.
 */
export function provideMockRouter(): Provider {
  return {
    provide: Router,
    useValue: {
      navigate: vi.fn().mockResolvedValue(true),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue(''),
      events: new Subject<any>(),
      routerState: {
        snapshot: { root: {} },
      },
    },
  };
}
