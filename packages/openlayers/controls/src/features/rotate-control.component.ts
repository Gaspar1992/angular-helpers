// OlRotateControlComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  InjectionToken,
} from '@angular/core';
import { OlZoneHelper } from '@angular-helpers/openlayers/core';
import type OLMap from 'ol/Map';
import Rotate from 'ol/control/Rotate';

/**
 * Interface for map service that rotate control needs
 * Implement this or provide your OlMapService using this token
 */
export interface RotateControlMapService {
  getMap(): OLMap | null;
  onReady(callback: (map: OLMap) => void): void;
}

/**
 * Injection token for map service used by rotate control
 * Consumers should provide their OlMapService using this token:
 * ```ts
 * { provide: ROTATE_CONTROL_MAP_SERVICE, useExisting: OlMapService }
 * ```
 */
export const ROTATE_CONTROL_MAP_SERVICE = new InjectionToken<RotateControlMapService>(
  'ROTATE_CONTROL_MAP_SERVICE',
);

@Component({
  selector: 'ol-rotate-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlRotateControlComponent {
  private mapService = inject(ROTATE_CONTROL_MAP_SERVICE, { optional: true });
  private zoneHelper = inject(OlZoneHelper);

  autoHide = input<boolean>(true);
  duration = input<number>(250);
  tipLabel = input<string>('Reset rotation');

  private control?: Rotate;

  constructor() {
    if (!this.mapService) return;

    const destroyRef = inject(DestroyRef);
    let destroyed = false;
    destroyRef.onDestroy(() => {
      if (this.control) {
        const map = this.mapService!.getMap();
        if (map) this.zoneHelper.runOutsideAngular(() => map.removeControl(this.control!));
      }
      destroyed = true;
    });

    afterNextRender(() => {
      if (destroyed) return;
      const map = this.mapService!.getMap();
      if (!map) return;
      this.zoneHelper.runOutsideAngular(() => {
        this.control = new Rotate({
          autoHide: this.autoHide(),
          duration: this.duration(),
          tipLabel: this.tipLabel(),
        });
        map.addControl(this.control);
      });
    });
  }
}
