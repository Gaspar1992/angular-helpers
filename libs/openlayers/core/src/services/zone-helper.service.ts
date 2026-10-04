// ZoneHelperService - Handles NgZone compatibility for zoneless mode

import { inject, Injectable, NgZone } from '@angular/core';

/**
 * Helper service that abstracts NgZone operations for zoneless compatibility.
 *
 * When NgZone is available (classic Angular):
 * - runOutsideAngular: executes outside Angular's zone for performance
 * - runInsideAngular: executes inside Angular's zone to trigger change detection
 *
 * When zoneless (signals-only Angular):
 * - Both methods execute directly since signals handle reactivity
 *
 * @usageNotes
 * Inject this service instead of NgZone directly:
 * ```ts
 * private zoneHelper = inject(OlZoneHelper);
 *
 * this.zoneHelper.runOutsideAngular(() => {
 *   // OpenLayers operations that don't need CD
 * });
 * ```
 */
@Injectable()
export class OlZoneHelper {
  private ngZone = inject(NgZone, { optional: true });

  /**
   * Runs callback outside Angular zone if available (for performance with NgZone),
   * or directly if zoneless.
   *
   * Use for: OpenLayers operations that don't need to trigger Angular change detection
   * (map manipulation, event listeners, animations)
   */
  runOutsideAngular<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.runOutsideAngular(fn);
    }
    return fn();
  }

  /**
   * Runs callback inside Angular zone if available (for triggering CD),
   * or directly if zoneless.
   *
   * Use for: Emitting outputs that should be handled by parent components
   */
  runInsideAngular<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.run(fn);
    }
    return fn();
  }
}
