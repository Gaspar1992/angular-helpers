import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { provideOpenLayers, OlMapService, type Feature } from '@angular-helpers/openlayers/core';
import { withControls, ROTATE_CONTROL_MAP_SERVICE } from '@angular-helpers/openlayers/controls';
import {
  withInteractions,
  withSelectInteraction,
  withDrawInteraction,
} from '@angular-helpers/openlayers/interactions';

describe('OpenLayers DX Hardening (T1)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('withControls binds ROTATE_CONTROL_MAP_SERVICE to OlMapService', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideOpenLayers(withControls())],
    });

    const mapService = TestBed.inject(OlMapService);
    const rotateMapService = TestBed.inject(ROTATE_CONTROL_MAP_SERVICE);

    expect(rotateMapService).toBe(mapService);
  });

  it('withInteractions accepts OlFeature<"interactions"> helpers inside provideOpenLayers', () => {
    expect(() => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideOpenLayers(
            withInteractions(),
            withSelectInteraction('sel-1', { multi: true }),
            withDrawInteraction('draw-1', { type: 'Point' }),
          ),
        ],
      });
      TestBed.inject(OlMapService);
    }).not.toThrow();
  });

  it('Feature<P> supports strongly typed properties', () => {
    interface ParcelProps extends Record<string, unknown> {
      parcelId: string;
      areaSqM: number;
    }

    const feature: Feature<ParcelProps> = {
      id: 'p-1',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {
        parcelId: 'A-100',
        areaSqM: 420,
      },
    };

    expect(feature.properties?.parcelId).toBe('A-100');
    expect(feature.properties?.areaSqM).toBe(420);
  });
});
