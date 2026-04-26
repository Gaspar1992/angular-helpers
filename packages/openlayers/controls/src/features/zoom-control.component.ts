// OlZoomControlComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import Zoom from 'ol/control/Zoom';

@Component({
  selector: 'ol-zoom-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlZoomControlComponent {
  private mapService = inject(OlMapService);
  private zoneHelper = inject(OlZoneHelper);

  delta = input<number>(1);
  duration = input<number>(250);

  private control?: Zoom;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let destroyed = false;
    destroyRef.onDestroy(() => {
      if (this.control) {
        const map = this.mapService.getMap();
        if (map) this.zoneHelper.runOutsideAngular(() => map.removeControl(this.control!));
      }
      destroyed = true;
    });

    afterNextRender(() => {
      if (destroyed) return;
      const map = this.mapService.getMap();
      if (!map) return;
      this.zoneHelper.runOutsideAngular(() => {
        this.control = new Zoom({ delta: this.delta(), duration: this.duration() });
        map.addControl(this.control);
      });
    });
  }
}
