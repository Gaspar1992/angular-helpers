// OlPopupComponent — declarative popup with content projection.

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import Overlay from 'ol/Overlay';
import type OLMap from 'ol/Map';
import type { Coordinate as OLCoordinate } from 'ol/coordinate';
import type { Coordinate } from '@angular-helpers/openlayers/core';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import type { OverlayPositioning } from '../models/overlay.types';

/**
 * Declarative map popup that projects arbitrary Angular content via `<ng-content>`.
 *
 * The component's host element is used directly as the `ol/Overlay`'s element, so
 * projected children stay inside Angular's component tree and benefit from change
 * detection without any extra plumbing.
 *
 * @example
 * ```html
 * <ol-popup
 *   [position]="selectedCoord()"
 *   [closeButton]="true"
 *   [autoPan]="true"
 *   (closed)="clearSelection()"
 * >
 *   <h3>{{ selected()?.name }}</h3>
 *   <p>{{ selected()?.description }}</p>
 * </ol-popup>
 * ```
 */
@Component({
  selector: 'ol-popup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (closeButton()) {
      <button type="button" class="ol-popup-close" aria-label="Close" (click)="onCloseClick()">
        ×
      </button>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }
    .ol-popup-close {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      padding: 0;
      border: none;
      background: transparent;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      color: inherit;
    }
  `,
  host: {
    role: 'dialog',
  },
})
export class OlPopupComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly mapService = inject(OlMapService);
  private readonly zoneHelper = inject(OlZoneHelper);

  /** Map coordinate where the popup is anchored. `null` hides the popup. */
  readonly position = input<Coordinate | null>(null);

  /** Pixel offset relative to `position`. */
  readonly offset = input<[number, number]>([0, 0]);

  /** Anchor of the popup element relative to `position`. */
  readonly positioning = input<OverlayPositioning>('bottom-center');

  /** Whether the map auto-pans to keep the popup in view. */
  readonly autoPan = input<boolean>(false);

  /** Whether to render the default close button. */
  readonly closeButton = input<boolean>(false);

  /** Emitted when the popup transitions from visible to hidden (close button or `position` set to null). */
  readonly closed = output<void>();

  private overlay: Overlay | null = null;
  private currentMap: OLMap | null = null;
  private wasVisible = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dispose());

    // Create the overlay lazily when the map becomes ready, then keep it in sync
    // with the inputs. The overlay's element is THIS component's host element so
    // projected content lives inside Angular's view tree.
    this.mapService.onReady((map) => {
      this.currentMap = map;
      this.zoneHelper.runOutsideAngular(() => {
        this.overlay = new Overlay({
          element: this.elementRef.nativeElement,
          stopEvent: true,
        });
      });
      this.applyState();
    });

    effect(() => {
      // Read every signal so the effect re-runs on any change.
      this.position();
      this.offset();
      this.positioning();
      this.autoPan();
      this.applyState();
    });
  }

  /** @internal */
  onCloseClick(): void {
    this.zoneHelper.runInsideAngular(() => this.closed.emit());
  }

  private applyState(): void {
    const overlay = this.overlay;
    const map = this.currentMap;
    if (!overlay || !map) return;

    const position = this.position();
    this.zoneHelper.runOutsideAngular(() => {
      overlay.setOffset(this.offset());
      overlay.setPositioning(this.positioning());
      const wantsAutoPan = this.autoPan();
      overlay.set('autoPan', wantsAutoPan);

      const visible = position !== null;
      if (visible && !this.wasVisible) {
        map.addOverlay(overlay);
      }
      overlay.setPosition(visible ? (position as OLCoordinate) : undefined);
      if (!visible && this.wasVisible) {
        map.removeOverlay(overlay);
        this.zoneHelper.runInsideAngular(() => this.closed.emit());
      }
      this.wasVisible = visible;
    });
  }

  private dispose(): void {
    if (!this.overlay || !this.currentMap) return;
    const overlay = this.overlay;
    const map = this.currentMap;
    this.zoneHelper.runOutsideAngular(() => {
      if (this.wasVisible) map.removeOverlay(overlay);
    });
    this.overlay = null;
    this.currentMap = null;
  }
}
