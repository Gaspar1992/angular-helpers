import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideOverlays } from './providers';
import { OlPopupService } from '../services/popup.service';
import { OlLayerService } from '@angular-helpers/openlayers/layers';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';

describe('Overlays Providers', () => {
  it('provideOverlays and withOverlays provides OlPopupService and OlLayerService', () => {
    const feature = provideOverlays();
    expect(feature.kind).toBe('overlays');

    TestBed.configureTestingModule({
      providers: [
        { provide: OlMapService, useValue: { getMap: () => null } },
        {
          provide: OlZoneHelper,
          useValue: { runOutsideAngular: (fn: any) => fn(), runInsideAngular: (fn: any) => fn() },
        },
        ...feature.providers,
      ],
    });

    const popupService = TestBed.inject(OlPopupService);
    const layerService = TestBed.inject(OlLayerService);

    expect(popupService).toBeInstanceOf(OlPopupService);
    expect(layerService).toBeInstanceOf(OlLayerService);
  });
});
