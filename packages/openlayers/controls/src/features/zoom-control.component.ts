// OlZoomControlComponent

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { NgZone } from '@angular/core';
import { OlMapService } from '@angular-helpers/openlayers/core';
import Zoom from 'ol/control/Zoom';

@Component({
  selector: 'ol-zoom-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlZoomControlComponent implements OnInit, OnDestroy {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  delta = input<number>(1);
  duration = input<number>(250);

  private control?: Zoom;

  ngOnInit(): void {
    const map = this.mapService.getMap();
    if (!map) return;

    this.ngZone.runOutsideAngular(() => {
      this.control = new Zoom({
        delta: this.delta(),
        duration: this.duration(),
      });
      map.addControl(this.control);
    });
  }

  ngOnDestroy(): void {
    const map = this.mapService.getMap();
    if (!this.control || !map) return;
    this.ngZone.runOutsideAngular(() => {
      map.removeControl(this.control!);
    });
  }
}
