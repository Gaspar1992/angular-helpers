import type { Feature } from '@angular-helpers/openlayers/core';

export type InteractionType = 'select' | 'draw' | 'modify' | 'dragAndDrop';
export interface InteractionConfig {
  active?: boolean;
}
export interface SelectConfig extends InteractionConfig {
  layers?: string[];
  multi?: boolean;
}
export interface DrawConfig extends InteractionConfig {
  type: 'Point' | 'LineString' | 'Polygon' | 'Circle';
  source?: string;
  freehand?: boolean;
}
export interface SelectEvent {
  feature: Feature;
  selected: boolean;
}
