import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebCryptoService } from './web-crypto.service';

export type CsrfStorageTarget = 'local' | 'session';

export type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface CsrfConfig {
  /** Storage used to persist the token. Default: `'session'`. */
  storage?: CsrfStorageTarget;
  /** Storage key. Default: `'__csrf_token__'`. */
  storageKey?: string;
}

export const CSRF_CONFIG = new InjectionToken<CsrfConfig>('CSRF_CONFIG');

const DEFAULT_STORAGE_KEY = '__csrf_token__';
const DEFAULT_TOKEN_BYTES = 32;

/**
 * CSRF token helper using the double-submit cookie / header pattern.
 *
 * The service stores a cryptographically secure token in the configured storage and exposes
 * it to HTTP interceptors ({@link withCsrfHeader}). Token lifecycle (creation, rotation,
 * clearing) is the application's responsibility — typically the token is issued by the
 * backend at login and stored via {@link storeToken}.
 *
 * Use a different header name than Angular's built-in XSRF ({@link `X-XSRF-TOKEN`}) to avoid
 * interaction with `HttpClientXsrfModule`. Default: {@link `X-CSRF-Token`}.
 */
@Injectable()
export class CsrfService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly webCrypto = inject(WebCryptoService);

  private readonly storageKey: string;
  private readonly storageTarget: CsrfStorageTarget;

  constructor() {
    const config = inject(CSRF_CONFIG, { optional: true }) ?? {};
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    this.storageTarget = config.storage ?? 'session';
  }

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && typeof window !== 'undefined';
  }

  /**
   * Generates a new CSRF token as a 32-byte hex string. The token is NOT persisted
   * automatically — call {@link storeToken} to save it.
   */
  generateToken(): string {
    const bytes = this.webCrypto.generateRandomBytes(DEFAULT_TOKEN_BYTES);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Persists the token to the configured storage.
   */
  storeToken(token: string): void {
    if (!this.isSupported()) return;
    this.nativeStorage.setItem(this.storageKey, token);
  }

  /**
   * Returns the stored token, or `null` when unset or outside a browser environment.
   */
  getToken(): string | null {
    if (!this.isSupported()) return null;
    return this.nativeStorage.getItem(this.storageKey);
  }

  /**
   * Removes the stored token.
   */
  clearToken(): void {
    if (!this.isSupported()) return;
    this.nativeStorage.removeItem(this.storageKey);
  }

  private get nativeStorage(): Storage {
    return this.storageTarget === 'session' ? sessionStorage : localStorage;
  }
}

export interface CsrfHeaderOptions {
  /** Header name to inject. Default: `'X-CSRF-Token'`. */
  headerName?: string;
  /** HTTP methods on which the header is injected. Default: `['POST','PUT','PATCH','DELETE']`. */
  methods?: readonly HttpMethod[];
}

const DEFAULT_HEADER_NAME = 'X-CSRF-Token';
const DEFAULT_METHODS: readonly HttpMethod[] = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Functional HTTP interceptor that injects the current CSRF token as a request header on
 * state-changing methods. When the token is absent, the header is omitted silently.
 *
 * Register via `provideHttpClient(withInterceptors([withCsrfHeader()]))`.
 *
 * @example
 * bootstrapApplication(App, {
 *   providers: [
 *     provideSecurity({ enableCsrf: true }),
 *     provideHttpClient(withInterceptors([withCsrfHeader()])),
 *   ],
 * });
 */
export function withCsrfHeader(options: CsrfHeaderOptions = {}): HttpInterceptorFn {
  const headerName = options.headerName ?? DEFAULT_HEADER_NAME;
  const methods = new Set(options.methods ?? DEFAULT_METHODS);

  return (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    if (!methods.has(request.method.toUpperCase() as HttpMethod)) {
      return next(request);
    }

    const csrf = inject(CsrfService);
    const token = csrf.getToken();
    if (!token) return next(request);

    return next(request.clone({ setHeaders: { [headerName]: token } }));
  };
}
