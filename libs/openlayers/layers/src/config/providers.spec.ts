import { describe, it, expect } from 'vitest';
import { Injector } from '@angular/core';
import { provideLayers } from './providers';
import { OlLayerService } from '../services/layer.service';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';

describe('Layers Providers', () => {
  it('provideLayers and withLayers returns feature config and provides OlLayerService', () => {
    const feature = provideLayers();
    expect(feature.kind).toBe('layers');

    const injector = Injector.create({
      providers: [
        { provide: OlMapService, useValue: { getMap: () => null } },
        {
          provide: OlZoneHelper,
          useValue: { runOutsideAngular: (fn: any) => fn(), runInsideAngular: (fn: any) => fn() },
        },
        ...feature.providers,
      ],
    });

    const layerService = injector.get(OlLayerService);
    expect(layerService).toBeInstanceOf(OlLayerService);
  });
});
