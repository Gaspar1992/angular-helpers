// OlMilitaryService

import { Injectable } from '@angular/core';
import type { Feature } from '@angular-helpers/openlayers/core';
import type { EllipseConfig, SectorConfig, MilSymbolConfig } from '../models/military.types';

@Injectable()
export class OlMilitaryService {
  createEllipse(config: EllipseConfig): Feature {
    return { id: 'ellipse-1', geometry: { type: 'Polygon', coordinates: [] } };
  }
  createSector(config: SectorConfig): Feature {
    return { id: 'sector-1', geometry: { type: 'Polygon', coordinates: [] } };
  }
  addMilSymbol(config: MilSymbolConfig): Feature {
    return {
      id: `symbol-${config.sidc}`,
      geometry: { type: 'Point', coordinates: config.position },
    };
  }
}
