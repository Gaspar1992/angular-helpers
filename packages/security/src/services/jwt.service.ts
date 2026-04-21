import { Injectable } from '@angular/core';

/**
 * Thrown when a string is not a well-formed JWT (wrong number of segments,
 * malformed base64url payload, or non-JSON payload).
 */
export class InvalidJwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidJwtError';
  }
}

/**
 * Standard JWT registered claims. See RFC 7519.
 */
export interface JwtStandardClaims {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

/**
 * Client-side JWT inspection utilities.
 *
 * **This service decodes JWT payloads for client-side inspection only. Signature verification
 * MUST happen server-side** — this service never validates signatures, issuer, audience,
 * or any trust-related property.
 *
 * Use cases:
 * - Reading the expiration to schedule refresh
 * - Extracting user-facing claims (e.g. `name`, `email`) for UX
 * - Detecting expired tokens to redirect to login
 *
 * @example
 * const token = localStorage.getItem('access_token');
 * if (!token || jwt.isExpired(token, 30)) {
 *   router.navigate(['/login']);
 * }
 * const userId = jwt.claim<string>(token, 'sub');
 */
@Injectable()
export class JwtService {
  /**
   * Decodes the payload segment of a JWT and returns it typed.
   *
   * @throws {InvalidJwtError} When the token is not three dot-separated segments,
   *   or when the payload cannot be base64url-decoded and parsed as JSON.
   */
  decode<T extends JwtStandardClaims = JwtStandardClaims>(token: string): T {
    if (typeof token !== 'string' || token.length === 0) {
      throw new InvalidJwtError('JWT is empty');
    }

    const segments = token.split('.');
    if (segments.length !== 3) {
      throw new InvalidJwtError(`JWT must have 3 segments, got ${segments.length}`);
    }

    const payloadSegment = segments[1];
    let json: string;
    try {
      json = base64UrlDecode(payloadSegment);
    } catch (cause) {
      throw new InvalidJwtError(
        `JWT payload is not valid base64url: ${cause instanceof Error ? cause.message : 'unknown'}`,
      );
    }

    try {
      return JSON.parse(json) as T;
    } catch (cause) {
      throw new InvalidJwtError(
        `JWT payload is not valid JSON: ${cause instanceof Error ? cause.message : 'unknown'}`,
      );
    }
  }

  /**
   * Returns `true` when the token is expired relative to `Date.now()`.
   * Missing or non-numeric `exp` counts as expired (fail-secure).
   *
   * @param leewaySeconds Optional clock-skew tolerance in seconds. Default: `0`.
   */
  isExpired(token: string, leewaySeconds = 0): boolean {
    let payload: JwtStandardClaims;
    try {
      payload = this.decode(token);
    } catch {
      return true;
    }

    if (typeof payload.exp !== 'number') return true;
    const expiresAtMs = payload.exp * 1000;
    return expiresAtMs <= Date.now() - leewaySeconds * 1000;
  }

  /**
   * Returns milliseconds until the token expires.
   * Negative when already expired. `0` when `exp` is missing.
   */
  expiresIn(token: string): number {
    let payload: JwtStandardClaims;
    try {
      payload = this.decode(token);
    } catch {
      return -1;
    }

    if (typeof payload.exp !== 'number') return 0;
    return payload.exp * 1000 - Date.now();
  }

  /**
   * Extracts a single claim from the payload. Returns `null` when the claim is absent
   * or the token is malformed.
   */
  claim<T = unknown>(token: string, name: string): T | null {
    let payload: Record<string, unknown>;
    try {
      payload = this.decode<Record<string, unknown>>(token);
    } catch {
      return null;
    }

    return (payload[name] as T | undefined) ?? null;
  }
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
