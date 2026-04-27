// OlTooltipDirective — feature hover tooltip on a vector layer.

import { DestroyRef, Directive, inject, input } from '@angular/core';
import type { Feature as OLFeature } from 'ol';
import type BaseLayer from 'ol/layer/Base';
import type OLMap from 'ol/Map';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';

/** Subset of `ol/MapBrowserEvent` we actually use. */
interface PointerMoveEvent {
  readonly pixel: [number, number];
}

/** Untyped passthrough for OL's `on/un` overloads which TS struggles to resolve. */
type EventfulMap = OLMap & {
  on(name: string, listener: (event: PointerMoveEvent) => void): void;
  un(name: string, listener: (event: PointerMoveEvent) => void): void;
};

/**
 * Shows a floating tooltip whose text is read from a feature property when the
 * pointer hovers over it. The tooltip element is appended to the map viewport
 * and styled minimally; consumers can override via the `.ol-tooltip` CSS hook.
 *
 * @example
 * ```html
 * <ol-vector-layer
 *   id="cities"
 *   [features]="cities()"
 *   [olTooltip]="'name'"
 * />
 * ```
 *
 * Apply `[olTooltipLayer]` to limit detection to a single layer (matches the
 * value of the layer's `id` property). Without it the tooltip reacts to any
 * feature found at the cursor.
 */
@Directive({
  selector: '[olTooltip]',
})
export class OlTooltipDirective {
  private readonly mapService = inject(OlMapService);
  private readonly zoneHelper = inject(OlZoneHelper);

  /** Property key to read from the hovered feature. */
  readonly olTooltip = input.required<string>();

  /** Optional layer id; when set, only features on that layer trigger the tooltip. */
  readonly olTooltipLayer = input<string | null>(null);

  private element: HTMLDivElement | null = null;
  private listener: ((event: PointerMoveEvent) => void) | null = null;
  private currentMap: OLMap | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dispose());

    this.mapService.onReady((map) => {
      this.currentMap = map;
      this.zoneHelper.runOutsideAngular(() => {
        const viewport = map.getViewport();
        const tooltip = document.createElement('div');
        tooltip.setAttribute('role', 'tooltip');
        tooltip.className = 'ol-tooltip';
        Object.assign(tooltip.style, {
          position: 'absolute',
          pointerEvents: 'none',
          padding: '4px 8px',
          background: 'rgba(0, 0, 0, 0.75)',
          color: '#fff',
          fontSize: '12px',
          borderRadius: '4px',
          display: 'none',
          whiteSpace: 'nowrap',
          zIndex: '1000',
        });
        viewport.appendChild(tooltip);
        this.element = tooltip;

        const handler = (event: PointerMoveEvent): void => {
          this.handlePointerMove(event, map);
        };
        (map as unknown as EventfulMap).on('pointermove', handler);
        this.listener = handler;
      });
    });
  }

  private handlePointerMove(event: PointerMoveEvent, map: OLMap): void {
    const tooltip = this.element;
    if (!tooltip) return;

    const layerId = this.olTooltipLayer();
    const propKey = this.olTooltip();

    let matched: OLFeature | null = null;
    map.forEachFeatureAtPixel(
      event.pixel,
      (feature) => {
        matched = feature as OLFeature;
        return true;
      },
      {
        layerFilter: layerId ? (layer: BaseLayer) => layer.get('id') === layerId : undefined,
      },
    );

    if (!matched) {
      tooltip.style.display = 'none';
      return;
    }

    const value = (matched as OLFeature).get(propKey);
    if (value === undefined || value === null) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.textContent = String(value);
    tooltip.style.display = 'block';
    const [x, y] = event.pixel;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
  }

  private dispose(): void {
    const map = this.currentMap;
    const listener = this.listener;
    if (map && listener) {
      this.zoneHelper.runOutsideAngular(() =>
        (map as unknown as EventfulMap).un('pointermove', listener),
      );
    }
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.listener = null;
    this.currentMap = null;
  }
}
