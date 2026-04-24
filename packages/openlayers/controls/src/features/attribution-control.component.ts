// OlAttributionControlComponent

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
import Attribution from 'ol/control/Attribution';

@Component({
  selector: 'ol-attribution-control',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlAttributionControlComponent implements OnInit, OnDestroy {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  collapsible = input<boolean>(true);
  collapsed = input<boolean>(true);

  private control?: Attribution;

  ngOnInit(): void {
    const map = this.mapService.getMap();
    if (!map) return;

    this.ngZone.runOutsideAngular(() => {
      this.control = new Attribution({
        collapsible: this.collapsible(),
        collapsed: this.collapsed(),
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
