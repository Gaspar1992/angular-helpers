// Provider functions

import type { Provider } from '@angular/core';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { OlMapService } from '../services/map.service';
import { OlZoneHelper } from '../services/zone-helper.service';

export type OlFeatureKind = 'layers' | 'controls' | 'interactions' | 'overlays' | 'military';

export interface OlFeature<Kind extends OlFeatureKind> {
  kind: Kind;
  providers: Provider[];
}

export function provideOpenLayers(...features: OlFeature<OlFeatureKind>[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    OlMapService,
    OlZoneHelper,
    ...features.flatMap((f) => f.providers),
  ]);
}
