// OlRotateControlComponent

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { NgZone } from '@angular/core';
import { OlMapService } from '../../../core/src/services/map.service';
import Rotate from 'ol/control/Rotate';

@Component({
  selector: 'ol-rotate-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlRotateControlComponent implements OnInit, OnDestroy {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  autoHide = input<boolean>(true);
  duration = input<number>(250);
  tipLabel = input<string>('Reset rotation');

  private control?: Rotate;

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
      this.control = new Rotate({
        autoHide: this.autoHide(),
        duration: this.duration(),
        tipLabel: this.tipLabel(),
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
