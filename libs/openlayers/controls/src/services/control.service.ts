// OlControlService

import { Injectable } from '@angular/core';
import type { ControlPosition } from '../models/control.types';

@Injectable()
export class OlControlService {
  addCustomControl(_element: HTMLElement, _position: ControlPosition): void {}
  removeCustomControl(_element: HTMLElement): void {}
}
