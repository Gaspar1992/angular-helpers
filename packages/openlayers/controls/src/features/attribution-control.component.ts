// OlAttributionControlComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { NgZone } from '@angular/core';
import { OlMapService } from '@angular-helpers/openlayers/core';
import Attribution from 'ol/control/Attribution';

@Component({
  selector: 'ol-attribution-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlAttributionControlComponent {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  collapsible = input<boolean>(true);
  collapsed = input<boolean>(true);

  private control?: Attribution;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let destroyed = false;
    destroyRef.onDestroy(() => {
      if (this.control) {
        const map = this.mapService.getMap();
        if (map) this.ngZone.runOutsideAngular(() => map.removeControl(this.control!));
      }
      destroyed = true;
    });

    afterNextRender(() => {
      if (destroyed) return;
      const map = this.mapService.getMap();
      if (!map) return;
      this.ngZone.runOutsideAngular(() => {
        this.control = new Attribution({
          collapsible: this.collapsible(),
          collapsed: this.collapsed(),
        });
        map.addControl(this.control);
      });
    });
  }
}
