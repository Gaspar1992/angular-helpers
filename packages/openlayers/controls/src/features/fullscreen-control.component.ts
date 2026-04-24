// OlFullscreenControlComponent

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
import FullScreen from 'ol/control/FullScreen';

@Component({
  selector: 'ol-fullscreen-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlFullscreenControlComponent implements OnInit, OnDestroy {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  source = input<HTMLElement>();
  label = input<string>('⤢');
  labelActive = input<string>('⤡');
  tipLabel = input<string>('Toggle full-screen');

  private control?: FullScreen;

  ngOnInit(): void {
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
  }

  ngOnDestroy(): void {
    const map = this.mapService.getMap();
    if (!this.control || !map) return;
    this.ngZone.runOutsideAngular(() => {
      map.removeControl(this.control!);
    });
  }
}
