import { PLATFORM_ID, inject } from '@angular/core';
import {
  isPlatformBrowser as isBrowserNative,
  isPlatformServer as isServerNative,
} from '@angular/common';
import { isPlatformBrowser } from '@angular-helpers/core/utils';

/**
 * Composable that resolves the current platform environment using Angular's Dependency Injection.
 * MUST be called within an injection context (e.g., inside a constructor or factory).
 */
export function injectPlatform() {
  try {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isBrowserNative(platformId);
    const isServer = isServerNative(platformId);

    return {
      isBrowser,
      isServer,
      window: isBrowser && typeof window !== 'undefined' ? window : null,
      document: isBrowser && typeof document !== 'undefined' ? document : null,
    };
  } catch {
    // Fallback if called outside an injection context (e.g. unit tests doing `new Service()`)
    const isBrowser = isPlatformBrowser();
    return {
      isBrowser,
      isServer: !isBrowser,
      window: isBrowser ? window : null,
      document: isBrowser ? document : null,
    };
  }
}

export { isPlatformBrowser, isPlatformServer, getGlobalWindow } from '@angular-helpers/core/utils';
