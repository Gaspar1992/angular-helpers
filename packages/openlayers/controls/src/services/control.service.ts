// OlControlService

import { Injectable } from '@angular/core';
import type { ControlPosition } from '../models/control.types';

@Injectable()
export class OlControlService {
  addCustomControl(element: HTMLElement, position: ControlPosition): void {}
  removeCustomControl(element: HTMLElement): void {}
}
