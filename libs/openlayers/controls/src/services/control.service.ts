// OlControlService

import { inject, Injectable } from '@angular/core';
import Control from 'ol/control/Control';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import type { ControlPosition } from '../models/control.types';

@Injectable()
export class OlControlService {
  private readonly mapService = safeInject(OlMapService);
  private readonly zoneHelper = safeInject(OlZoneHelper);
  private readonly customControls = new Map<HTMLElement, Control>();

  addCustomControl(element: HTMLElement, position: ControlPosition = 'top-right'): void {
    this.removeCustomControl(element);
    element.classList.add('ol-control', 'ol-unselectable', position);
    if (!this.mapService || !this.zoneHelper) return;
    const control = new Control({ element });
    this.customControls.set(element, control);
    this.mapService.onReady((map) => {
      this.zoneHelper!.runOutsideAngular(() => map.addControl(control));
    });
  }

  removeCustomControl(element: HTMLElement): void {
    const control = this.customControls.get(element);
    if (!control) return;
    this.customControls.delete(element);
    const map = this.mapService?.getMap();
    if (this.zoneHelper) {
      this.zoneHelper.runOutsideAngular(() => {
        if (map) map.removeControl(control);
        control.dispose();
      });
    } else {
      if (map) map.removeControl(control);
      control.dispose();
    }
  }
}

function safeInject<T>(token: new (...args: never[]) => T): T | null {
  try {
    return inject(token, { optional: true });
  } catch {
    return null;
  }
}
