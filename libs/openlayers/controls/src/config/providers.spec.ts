import { describe, it, expect } from 'vitest';
import { Injector } from '@angular/core';
import { provideControls } from './providers';
import { OlControlService } from '../services/control.service';
import { ROTATE_CONTROL_MAP_SERVICE } from '../features/rotate-control.component';

describe('Controls Providers', () => {
  it('provideControls and withControls provides OlControlService and ROTATE_CONTROL_MAP_SERVICE', () => {
    const feature = provideControls();
    expect(feature.kind).toBe('controls');

    const injector = Injector.create({
      providers: [...feature.providers],
    });

    const controlService = injector.get(OlControlService);
    const rotateMapService = injector.get(ROTATE_CONTROL_MAP_SERVICE);

    expect(controlService).toBeInstanceOf(OlControlService);
    expect(rotateMapService).toBeDefined();
    expect(rotateMapService.getMap()).toBeNull();
  });
});
