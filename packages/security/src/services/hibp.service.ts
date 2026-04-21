import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WebCryptoService } from './web-crypto.service';

export interface HibpConfig {
  /**
   * Base URL for the HIBP Pwned Passwords range API.
   * Default: `https://api.pwnedpasswords.com/range/`.
   * Override when routing through an enterprise proxy or test fixture.
   */
  endpoint?: string;
}

export const HIBP_CONFIG = new InjectionToken<HibpConfig>('HIBP_CONFIG');

/**
 * Result of a leaked-password lookup.
 *
 * - `leaked: true` — the password hash was found in the HIBP breach corpus
 * - `leaked: false` — password is not known to be leaked (either truly safe, or the lookup failed)
 * - `error: 'network'` — HIBP endpoint unreachable; defaults to `leaked: false` (fail-open)
 * - `error: 'unsupported'` — running outside a secure browser context
 */
export interface HibpResult {
  leaked: boolean;
  count: number;
  error?: 'network' | 'unsupported';
}

const DEFAULT_ENDPOINT = 'https://api.pwnedpasswords.com/range/';

/**
 * Checks whether a password appears in the Have I Been Pwned breach corpus using the
 * k-anonymity API. Only the first 5 hex characters of the SHA-1 hash leave the browser;
 * the full password is never transmitted.
 *
 * The service is fail-open: network errors return `{ leaked: false, error: 'network' }`
 * to avoid blocking form submissions when HIBP is unreachable. Use this signal to
 * *complement* entropy-based checks, never as the sole gate.
 *
 * @example
 * const { leaked, count } = await hibp.isPasswordLeaked(password);
 * if (leaked) alert(`This password has appeared in ${count} breaches`);
 */
@Injectable()
export class HibpService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly webCrypto = inject(WebCryptoService);

  private readonly endpoint: string;

  constructor() {
    const config = inject(HIBP_CONFIG, { optional: true }) ?? {};
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
  }

  isSupported(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      typeof fetch === 'function' &&
      this.webCrypto.isSupported()
    );
  }

  /**
   * Returns whether the given password is present in the HIBP breach corpus.
   * Never throws: network failures return `{ leaked: false, error: 'network' }`,
   * unsupported environments return `{ leaked: false, error: 'unsupported' }`.
   */
  async isPasswordLeaked(password: string): Promise<HibpResult> {
    if (!this.isSupported()) {
      return { leaked: false, count: 0, error: 'unsupported' };
    }

    if (!password) {
      return { leaked: false, count: 0 };
    }

    let hashHex: string;
    try {
      hashHex = (await this.webCrypto.hash(password, 'SHA-1')).toUpperCase();
    } catch {
      return { leaked: false, count: 0, error: 'unsupported' };
    }

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    let body: string;
    try {
      const response = await fetch(`${this.endpoint}${prefix}`, {
        method: 'GET',
        headers: { 'Add-Padding': 'true' },
      });

      if (response.status === 404) {
        return { leaked: false, count: 0 };
      }

      if (!response.ok) {
        return { leaked: false, count: 0, error: 'network' };
      }

      body = await response.text();
    } catch {
      return { leaked: false, count: 0, error: 'network' };
    }

    const match = findSuffixMatch(body, suffix);
    return match > 0 ? { leaked: true, count: match } : { leaked: false, count: 0 };
  }
}

function findSuffixMatch(body: string, suffix: string): number {
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const lineSuffix = line.slice(0, separatorIndex).trim().toUpperCase();
    if (lineSuffix !== suffix) continue;

    const count = parseInt(line.slice(separatorIndex + 1).trim(), 10);
    // Padding rows (not in breach) have count 0; treat them as no match.
    return Number.isFinite(count) && count > 0 ? count : 0;
  }
  return 0;
}
