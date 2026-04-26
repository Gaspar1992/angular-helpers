// OlScaleLineControlComponent

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
import ScaleLine from 'ol/control/ScaleLine';

@Component({
  selector: 'ol-scale-line-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlScaleLineControlComponent {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  units = input<'metric' | 'imperial' | 'nautical' | 'us'>('metric');
  bar = input<boolean>(false);
  steps = input<number>(4);

  private control?: ScaleLine;

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
        this.control = new ScaleLine({
          units: this.units(),
          bar: this.bar(),
          steps: this.steps(),
        });
        map.addControl(this.control);
      });
    });
  }
}
