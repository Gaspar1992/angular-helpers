import {
  DestroyRef,
  Injectable,
  InjectionToken,
  type Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SecureStorageService } from './secure-storage.service';

export type RateLimitPolicy =
  | {
      type: 'token-bucket';
      capacity: number;
      refillPerSecond: number;
      storage?: 'memory' | 'local' | 'session' | 'secure';
    }
  | {
      type: 'sliding-window';
      max: number;
      windowMs: number;
      storage?: 'memory' | 'local' | 'session' | 'secure';
    };

interface PersistedState {
  tokens?: number;
  lastRefillAt?: number;
  timestamps?: number[];
}

export interface RateLimiterConfig {
  /**
   * Policies registered at bootstrap. Can also be set at runtime via
   * {@link RateLimiterService.configure}.
   */
  defaults?: Record<string, RateLimitPolicy>;
}

export const RATE_LIMITER_CONFIG = new InjectionToken<RateLimiterConfig>('RATE_LIMITER_CONFIG');

/**
 * Thrown by {@link RateLimiterService.consume} when the configured capacity is exhausted.
 */
export class RateLimitExceededError extends Error {
  constructor(
    readonly key: string,
    readonly retryAfterMs: number,
  ) {
    super(`Rate limit exceeded for "${key}". Retry after ${retryAfterMs}ms.`);
    this.name = 'RateLimitExceededError';
  }
}

interface BucketState {
  policy: RateLimitPolicy;
  // Token-bucket state
  tokens: number;
  lastRefillAt: number;
  // Sliding-window state
  timestamps: number[];
  // Reactive signal — current remaining units
  remaining: ReturnType<typeof signal<number>>;
  timerId?: any;
}

/**
 * Client-side rate limiter with per-key policies. Use to protect the user's own backend
 * from accidental bursts (search-as-you-type, button mashing, automated retries) or to
 * pace client-side operations.
 *
 * Two policies are supported:
 * - **Token bucket**: smooth rate limiting with burst capacity.
 * - **Sliding window**: strict max operations per time window.
 *
 * Unknown keys are fail-open: `canExecute` returns `true`, `consume` is a no-op. Register
 * policies explicitly with {@link configure} or via the `RATE_LIMITER_CONFIG` token.
 *
 * All state is kept in memory for the lifetime of the service instance — cross-tab
 * synchronization is out of scope for v1.
 *
 * @example
 * rateLimiter.configure('search', { type: 'token-bucket', capacity: 5, refillPerSecond: 1 });
 *
 * async search(query: string) {
 *   await rateLimiter.consume('search'); // throws RateLimitExceededError when exhausted
 *   return this.api.search(query);
 * }
 */
@Injectable()
export class RateLimiterService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly secureStorage = inject(SecureStorageService, { optional: true });

  private readonly buckets = new Map<string, BucketState>();

  constructor() {
    const config = inject(RATE_LIMITER_CONFIG, { optional: true });
    if (config?.defaults) {
      for (const [key, policy] of Object.entries(config.defaults)) {
        this.configure(key, policy);
      }
    }
    this.destroyRef.onDestroy(() => {
      for (const bucket of this.buckets.values()) {
        if (bucket.timerId) clearTimeout(bucket.timerId);
      }
      this.buckets.clear();
    });
  }

  /**
   * Registers or updates the policy for `key`. Re-configuring an existing key resets its state.
   */
  async configure(key: string, policy: RateLimitPolicy): Promise<void> {
    validatePolicy(policy);

    const existing = this.buckets.get(key);
    if (existing && existing.timerId) {
      clearTimeout(existing.timerId);
    }

    const now = Date.now();
    const initialRemaining = policy.type === 'token-bucket' ? policy.capacity : policy.max;

    const bucket: BucketState = {
      policy,
      tokens: policy.type === 'token-bucket' ? policy.capacity : 0,
      lastRefillAt: now,
      timestamps: [],
      remaining: signal(initialRemaining),
    };

    this.buckets.set(key, bucket);

    await this.loadPersistedState(key, bucket);

    const loadTime = Date.now();
    if (bucket.policy.type === 'token-bucket') {
      this.refillTokenBucket(bucket, loadTime);
    } else {
      const windowStart = loadTime - bucket.policy.windowMs;
      bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
      bucket.remaining.set(bucket.policy.max - bucket.timestamps.length);
    }

    this.scheduleAutoRefill(key, bucket);
  }

  /**
   * Attempts to consume `tokens` units from the bucket. Resolves on success; rejects with
   * {@link RateLimitExceededError} when the bucket is exhausted.
   *
   * For undeclared keys, this method resolves immediately without consuming anything
   * (fail-open behaviour — intentional to avoid silent failures when a policy is missing).
   */
  async consume(key: string, tokens = 1): Promise<void> {
    const bucket = this.buckets.get(key);
    if (!bucket) return;

    await this.loadPersistedState(key, bucket);

    const now = Date.now();

    if (bucket.policy.type === 'token-bucket') {
      this.refillTokenBucket(bucket, now);
      if (tokens > bucket.policy.capacity) {
        throw new RateLimitExceededError(key, Infinity);
      }
      if (bucket.tokens < tokens) {
        const deficit = tokens - bucket.tokens;
        const retryAfterMs = Math.ceil((deficit / bucket.policy.refillPerSecond) * 1000);
        await this.savePersistedState(key, bucket);
        throw new RateLimitExceededError(key, retryAfterMs);
      }
      bucket.tokens -= tokens;
      bucket.remaining.set(Math.floor(bucket.tokens));

      this.scheduleAutoRefill(key, bucket);
      await this.savePersistedState(key, bucket);
      return;
    }

    // sliding-window
    const windowStart = now - bucket.policy.windowMs;
    bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
    if (bucket.timestamps.length + tokens > bucket.policy.max) {
      const oldest = bucket.timestamps[0] ?? now;
      const retryAfterMs = Math.max(0, oldest + bucket.policy.windowMs - now);
      await this.savePersistedState(key, bucket);
      throw new RateLimitExceededError(key, retryAfterMs);
    }
    for (let i = 0; i < tokens; i++) bucket.timestamps.push(now);
    bucket.remaining.set(bucket.policy.max - bucket.timestamps.length);

    this.scheduleAutoRefill(key, bucket);
    await this.savePersistedState(key, bucket);
  }

  /**
   * Reactive signal indicating whether a single unit can be consumed from `key` right now.
   * For undeclared keys, returns `signal(true)`.
   */
  canExecute(key: string): Signal<boolean> {
    const bucket = this.buckets.get(key);
    if (!bucket) return signal(true).asReadonly();
    return computed(() => bucket.remaining() >= 1);
  }

  /**
   * Reactive signal holding the remaining capacity for `key`.
   * For undeclared keys, returns `signal(Infinity)`.
   */
  remaining(key: string): Signal<number> {
    const bucket = this.buckets.get(key);
    if (!bucket) return signal(Number.POSITIVE_INFINITY).asReadonly();
    return bucket.remaining.asReadonly();
  }

  /**
   * Resets the counter for `key` to its maximum. No-op for undeclared keys.
   */
  async reset(key: string): Promise<void> {
    const bucket = this.buckets.get(key);
    if (!bucket) return;

    if (bucket.timerId) {
      clearTimeout(bucket.timerId);
      bucket.timerId = undefined;
    }

    bucket.timestamps = [];
    if (bucket.policy.type === 'token-bucket') {
      bucket.tokens = bucket.policy.capacity;
      bucket.lastRefillAt = Date.now();
      bucket.remaining.set(bucket.policy.capacity);
    } else {
      bucket.remaining.set(bucket.policy.max);
    }

    const storageType = bucket.policy.storage ?? 'memory';
    if (storageType !== 'memory') {
      const storageKey = `rate-limit:${key}`;
      try {
        if (storageType === 'secure') {
          if (this.secureStorage) {
            await this.secureStorage.remove(storageKey);
          }
        } else {
          const storage = storageType === 'local' ? localStorage : sessionStorage;
          storage.removeItem(storageKey);
        }
      } catch (e) {
        console.warn(`Failed to clear rate limiter state for key "${key}":`, e);
      }
    }
  }

  private async loadPersistedState(key: string, bucket: BucketState): Promise<void> {
    const storageType = bucket.policy.storage ?? 'memory';
    if (storageType === 'memory') return;

    const storageKey = `rate-limit:${key}`;
    let state: PersistedState | null = null;

    try {
      if (storageType === 'secure') {
        if (this.secureStorage) {
          state = await this.secureStorage.get<PersistedState>(storageKey);
        }
      } else {
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        const raw = storage.getItem(storageKey);
        if (raw) {
          state = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn(`Failed to load rate limiter state for key "${key}":`, e);
    }

    if (state) {
      if (bucket.policy.type === 'token-bucket') {
        if (typeof state.tokens === 'number') {
          bucket.tokens = state.tokens;
        }
        if (typeof state.lastRefillAt === 'number') {
          bucket.lastRefillAt = state.lastRefillAt;
        }
        bucket.remaining.set(Math.floor(bucket.tokens));
      } else {
        if (Array.isArray(state.timestamps)) {
          bucket.timestamps = state.timestamps;
        }
        bucket.remaining.set(bucket.policy.max - bucket.timestamps.length);
      }
    }
  }

  private async savePersistedState(key: string, bucket: BucketState): Promise<void> {
    const storageType = bucket.policy.storage ?? 'memory';
    if (storageType === 'memory') return;

    const storageKey = `rate-limit:${key}`;
    const state: PersistedState =
      bucket.policy.type === 'token-bucket'
        ? { tokens: bucket.tokens, lastRefillAt: bucket.lastRefillAt }
        : { timestamps: bucket.timestamps };

    try {
      if (storageType === 'secure') {
        if (this.secureStorage) {
          await this.secureStorage.set(storageKey, state);
        }
      } else {
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        storage.setItem(storageKey, JSON.stringify(state));
      }
    } catch (e) {
      console.warn(`Failed to save rate limiter state for key "${key}":`, e);
    }
  }

  private refillTokenBucket(bucket: BucketState, now: number): void {
    if (bucket.policy.type !== 'token-bucket') return;

    const elapsedSec = (now - bucket.lastRefillAt) / 1000;
    if (elapsedSec <= 0) return;

    const refilled = elapsedSec * bucket.policy.refillPerSecond;
    bucket.tokens = Math.min(bucket.policy.capacity, bucket.tokens + refilled);
    bucket.lastRefillAt = now;
    bucket.remaining.set(Math.floor(bucket.tokens));
  }

  private scheduleAutoRefill(key: string, bucket: BucketState): void {
    if (bucket.timerId) {
      clearTimeout(bucket.timerId);
      bucket.timerId = undefined;
    }

    const now = Date.now();

    if (bucket.policy.type === 'token-bucket') {
      if (bucket.tokens >= bucket.policy.capacity) {
        return;
      }

      const currentFloor = Math.floor(bucket.tokens);
      const nextInteger = currentFloor + 1;
      const deficit = nextInteger - bucket.tokens;
      const timeToNextTokenMs = Math.max(
        10,
        Math.ceil((deficit / bucket.policy.refillPerSecond) * 1000),
      );

      bucket.timerId = setTimeout(() => {
        const tNow = Date.now();
        this.refillTokenBucket(bucket, tNow);
        this.scheduleAutoRefill(key, bucket);
      }, timeToNextTokenMs);
    } else {
      // sliding-window
      const windowStart = now - bucket.policy.windowMs;
      bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
      bucket.remaining.set(bucket.policy.max - bucket.timestamps.length);

      if (bucket.timestamps.length === 0) {
        return;
      }

      const oldest = bucket.timestamps[0];
      const timeToExpiryMs = Math.max(10, oldest + bucket.policy.windowMs - now);

      bucket.timerId = setTimeout(() => {
        this.scheduleAutoRefill(key, bucket);
      }, timeToExpiryMs);
    }
  }
}

function validatePolicy(policy: RateLimitPolicy): void {
  if (policy.type === 'token-bucket') {
    if (policy.capacity <= 0 || policy.refillPerSecond <= 0) {
      throw new RangeError('Token-bucket policy requires capacity > 0 and refillPerSecond > 0');
    }
    return;
  }

  if (policy.max <= 0 || policy.windowMs <= 0) {
    throw new RangeError('Sliding-window policy requires max > 0 and windowMs > 0');
  }
}
