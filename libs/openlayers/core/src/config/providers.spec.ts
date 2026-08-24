import { describe, it, expect } from 'vitest';
import { provideOpenLayers, type OlFeature } from './providers';
import { OlMapService } from '../services/map.service';
import { OlZoneHelper } from '../services/zone-helper.service';
import { Injector } from '@angular/core';

describe('provideOpenLayers', () => {
  it('should provide OlMapService and OlZoneHelper by default', () => {
    const envProviders = provideOpenLayers();
    expect(envProviders).toBeDefined();

    const injector = Injector.create({
      providers: [envProviders],
    });

    const mapService = injector.get(OlMapService);
    const zoneHelper = injector.get(OlZoneHelper);

    expect(mapService).toBeInstanceOf(OlMapService);
    expect(zoneHelper).toBeInstanceOf(OlZoneHelper);
  });

  it('should include feature providers when passed', () => {
    class CustomFeatureService {}
    const dummyFeature: OlFeature<'military'> = {
      kind: 'military',
      providers: [CustomFeatureService],
    };

    const envProviders = provideOpenLayers(dummyFeature);
    const injector = Injector.create({
      providers: [envProviders],
    });

    const customService = injector.get(CustomFeatureService);
    expect(customService).toBeInstanceOf(CustomFeatureService);
  });
});
