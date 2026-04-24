// OlScaleLineControlComponent

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
import ScaleLine from 'ol/control/ScaleLine';

@Component({
  selector: 'ol-scale-line-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlScaleLineControlComponent implements OnInit, OnDestroy {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  units = input<'metric' | 'imperial' | 'nautical' | 'us'>('metric');
  bar = input<boolean>(false);
  steps = input<number>(4);

  private control?: ScaleLine;

  ngOnInit(): void {
    this.tryAddControl();
  }

  private tryAddControl(retryCount = 0): void {
    const map = this.mapService.getMap();
    if (!map) {
      if (retryCount < 10) {
        setTimeout(() => this.tryAddControl(retryCount + 1), Math.min(50 * (retryCount + 1), 500));
      }
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.control = new ScaleLine({
        units: this.units(),
        bar: this.bar(),
        steps: this.steps(),
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
