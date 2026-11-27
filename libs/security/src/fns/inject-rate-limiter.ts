import { inject, type Signal } from '@angular/core';
import {
  RateLimiterService,
  RateLimitExceededError,
  type RateLimitPolicy,
  type RateLimiterConfig,
} from '../services/rate-limiter.service';

export interface RateLimiterRef {
  configure: (key: string, policy: RateLimitPolicy) => Promise<void>;
  consume: (key: string, tokens?: number) => Promise<void>;
  tryConsume: (key: string, tokens?: number) => Promise<boolean>;
  canExecute: (key: string) => Signal<boolean>;
  remaining: (key: string) => Signal<number>;
  reset: (key: string) => Promise<void>;
}

/**
 * Signal-first injection primitive for {@link RateLimiterService}.
 * Optionally registers default policies on creation.
 */
export function injectRateLimiter(config?: RateLimiterConfig): RateLimiterRef {
  const service = inject(RateLimiterService);

  if (config?.defaults) {
    for (const [key, policy] of Object.entries(config.defaults)) {
      void service.configure(key, policy);
    }
  }

  return {
    configure: (key, policy) => service.configure(key, policy),
    consume: (key, tokens) => service.consume(key, tokens),
    tryConsume: async (key, tokens) => {
      try {
        await service.consume(key, tokens);
        return true;
      } catch (err) {
        if (err instanceof RateLimitExceededError) {
          return false;
        }
        throw err;
      }
    },
    canExecute: (key) => service.canExecute(key),
    remaining: (key) => service.remaining(key),
    reset: (key) => service.reset(key),
  };
}
