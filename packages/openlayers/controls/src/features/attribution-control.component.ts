// OlAttributionControlComponent

import { afterNextRender, Component, DestroyRef, inject, input } from '@angular/core';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import Attribution from 'ol/control/Attribution';

@Component({
  selector: 'ol-attribution-control',
  template: '',
})
export class OlAttributionControlComponent {
  private mapService = inject(OlMapService);
  private zoneHelper = inject(OlZoneHelper);

  collapsible = input<boolean>(true);
  collapsed = input<boolean>(true);

  private control?: Attribution;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let destroyed = false;
    destroyRef.onDestroy(() => {
      if (this.control) {
        const map = this.mapService.getMap();
        this.zoneHelper.runOutsideAngular(() => {
          if (map) map.removeControl(this.control!);
          this.control!.dispose();
        });
      }
      destroyed = true;
    });

    afterNextRender(() => {
      if (destroyed) return;
      const map = this.mapService.getMap();
      if (!map) return;
      this.zoneHelper.runOutsideAngular(() => {
        this.control = new Attribution({
          collapsible: this.collapsible(),
          collapsed: this.collapsed(),
        });
        map.addControl(this.control);
      });
    });
  }
}
