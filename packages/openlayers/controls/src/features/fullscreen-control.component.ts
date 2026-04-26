// OlFullscreenControlComponent

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
import FullScreen from 'ol/control/FullScreen';

@Component({
  selector: 'ol-fullscreen-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlFullscreenControlComponent {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  source = input<HTMLElement>();
  label = input<string>('⤢');
  labelActive = input<string>('⤡');
  tipLabel = input<string>('Toggle full-screen');

  private control?: FullScreen;

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
        this.control = new FullScreen({
          source: this.source(),
          label: this.label(),
          labelActive: this.labelActive(),
          tipLabel: this.tipLabel(),
        });
        map.addControl(this.control);
      });
    });
  }
}
