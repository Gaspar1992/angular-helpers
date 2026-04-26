// OlRotateControlComponent

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  OnDestroy,
  InjectionToken,
} from '@angular/core';
import { NgZone } from '@angular/core';
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
export class OlRotateControlComponent implements OnInit, OnDestroy {
  private mapService = inject(ROTATE_CONTROL_MAP_SERVICE, { optional: true });
  private ngZone = inject(NgZone);

  autoHide = input<boolean>(true);
  duration = input<number>(250);
  tipLabel = input<string>('Reset rotation');

  private control?: Rotate;

  ngOnInit(): void {
    if (!this.mapService) return;
    this.mapService.onReady((map) => {
      this.ngZone.runOutsideAngular(() => {
        this.control = new Rotate({
          autoHide: this.autoHide(),
          duration: this.duration(),
          tipLabel: this.tipLabel(),
        });
        map.addControl(this.control);
      });
    });
  }

  ngOnDestroy(): void {
    if (!this.mapService) return;
    const map = this.mapService.getMap();
    if (!this.control || !map) return;
    this.ngZone.runOutsideAngular(() => {
      map.removeControl(this.control!);
    });
  }
}
