// OlPopupService

import { Injectable } from '@angular/core';
import type { Coordinate } from '@angular-helpers/openlayers/core';
import type { PopupOptions } from '../models/overlay.types';

@Injectable()
export class OlPopupService {
  showPopup(options: PopupOptions): string {
    return 'popup-id';
  }
  hidePopup(id: string): void {}
  hideAllPopups(): void {}
}
