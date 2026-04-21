import {
  DestroyRef,
  Injectable,
  InjectionToken,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';

export type RateLimitPolicy =
  | { type: 'token-bucket'; capacity: number; refillPerSecond: number }
  | { type: 'sliding-window'; max: number; windowMs: number };

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

  private readonly buckets = new Map<string, BucketState>();

  constructor() {
    const config = inject(RATE_LIMITER_CONFIG, { optional: true });
    if (config?.defaults) {
      for (const [key, policy] of Object.entries(config.defaults)) {
        this.configure(key, policy);
      }
    }
    this.destroyRef.onDestroy(() => this.buckets.clear());
  }

  /**
   * Registers or updates the policy for `key`. Re-configuring an existing key resets its state.
   */
  configure(key: string, policy: RateLimitPolicy): void {
    validatePolicy(policy);

    const now = Date.now();
    const initialRemaining = policy.type === 'token-bucket' ? policy.capacity : policy.max;

    this.buckets.set(key, {
      policy,
      tokens: policy.type === 'token-bucket' ? policy.capacity : 0,
      lastRefillAt: now,
      timestamps: [],
      remaining: signal(initialRemaining),
    });
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

    const now = Date.now();

    if (bucket.policy.type === 'token-bucket') {
      this.refillTokenBucket(bucket, now);
      if (tokens > bucket.policy.capacity) {
        throw new RateLimitExceededError(key, Infinity);
      }
      if (bucket.tokens < tokens) {
        const deficit = tokens - bucket.tokens;
        const retryAfterMs = Math.ceil((deficit / bucket.policy.refillPerSecond) * 1000);
        throw new RateLimitExceededError(key, retryAfterMs);
      }
      bucket.tokens -= tokens;
      bucket.remaining.set(Math.floor(bucket.tokens));
      return;
    }

    // sliding-window
    const windowStart = now - bucket.policy.windowMs;
    bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
    if (bucket.timestamps.length + tokens > bucket.policy.max) {
      const oldest = bucket.timestamps[0] ?? now;
      const retryAfterMs = Math.max(0, oldest + bucket.policy.windowMs - now);
      throw new RateLimitExceededError(key, retryAfterMs);
    }
    for (let i = 0; i < tokens; i++) bucket.timestamps.push(now);
    bucket.remaining.set(bucket.policy.max - bucket.timestamps.length);
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
  reset(key: string): void {
    const bucket = this.buckets.get(key);
    if (!bucket) return;

    bucket.timestamps = [];
    if (bucket.policy.type === 'token-bucket') {
      bucket.tokens = bucket.policy.capacity;
      bucket.lastRefillAt = Date.now();
      bucket.remaining.set(bucket.policy.capacity);
    } else {
      bucket.remaining.set(bucket.policy.max);
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
