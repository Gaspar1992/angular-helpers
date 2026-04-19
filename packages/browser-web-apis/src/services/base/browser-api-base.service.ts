import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BROWSER_API_LOGGER } from '../../tokens/logger.token';
import { BrowserCapabilityService, type BrowserCapabilityId } from '../browser-capability.service';

/**
 * Base class for all Browser Web API services.
 *
 * ## Support detection contract
 *
 * Services follow ONE pattern (do not invent variants):
 *
 * - `isSupported(): boolean` — public, side-effect free, SSR-safe. Default
 *   implementation delegates to {@link BrowserCapabilityService} when the subclass
 *   overrides {@link getCapabilityId} (recommended).
 * - `ensureSupported(): void` — internal Template Method. Throws when called outside
 *   browser or when the underlying API is missing.
 *
 * ## Error surfacing contract
 *
 * - **Imperative methods** MUST call `ensureSupported()` and throw synchronously.
 * - **Stream-returning methods** MUST guard with `isSupported()` and surface
 *   unsupported state as `Observable.error(...)` (NOT throw inline).
 *
 * Services that also need permission querying should extend
 * `PermissionAwareBrowserApiBaseService` instead.
 */
@Injectable()
export abstract class BrowserApiBaseService {
  protected destroyRef = inject(DestroyRef);
  protected platformId = inject(PLATFORM_ID);
  private readonly logger = inject(BROWSER_API_LOGGER);
  private readonly capabilities = inject(BrowserCapabilityService);

  /** API name used in log messages and error strings. */
  protected abstract getApiName(): string;

  /**
   * Optional hook for subclasses to delegate feature detection to
   * {@link BrowserCapabilityService}. Returning a capability id removes the need to
   * implement `isSupported()` manually and avoids drift between per-service checks
   * and the centralized capability registry.
   */
  protected getCapabilityId(): BrowserCapabilityId | null {
    return null;
  }

  /** Public, SSR-safe support check. Override only if you need extra constraints. */
  isSupported(): boolean {
    if (!this.isBrowserEnvironment()) return false;
    const capabilityId = this.getCapabilityId();
    if (capabilityId !== null) {
      return this.capabilities.isSupported(capabilityId);
    }
    return true;
  }

  protected isBrowserEnvironment(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  protected isServerEnvironment(): boolean {
    return isPlatformServer(this.platformId);
  }

  /**
   * Template Method: asserts the service can run in the current environment. Subclasses
   * that need extra checks beyond capability detection MUST call `super.ensureSupported()`
   * first, then add their own check.
   */
  protected ensureSupported(): void {
    if (!this.isBrowserEnvironment()) {
      throw new Error(`${this.getApiName()} API not available in server environment`);
    }
    const capabilityId = this.getCapabilityId();
    if (capabilityId !== null && !this.capabilities.isSupported(capabilityId)) {
      throw new Error(`${this.getApiName()} API not supported in this browser`);
    }
  }

  protected createError(message: string, cause?: unknown): Error {
    const error = new Error(message);
    if (cause !== undefined) {
      (error as Error & { cause: unknown }).cause = cause;
    }
    return error;
  }

  protected logError(message: string, error?: unknown): void {
    this.logger.error(`[${this.getApiName()}] ${message}`, error);
  }

  protected logWarn(message: string): void {
    this.logger.warn(`[${this.getApiName()}] ${message}`);
  }

  protected logInfo(message: string): void {
    this.logger.info(`[${this.getApiName()}] ${message}`);
  }
}
