import type { Feature } from '@angular-helpers/openlayers/core';

export type InteractionType = 'select' | 'draw' | 'modify' | 'dragAndDrop';

export interface InteractionConfig {
  active?: boolean;
}

export interface SelectConfig extends InteractionConfig {
  layers?: string[];
  multi?: boolean;
  hitTolerance?: number;
}

export interface DrawConfig extends InteractionConfig {
  type: 'Point' | 'LineString' | 'Polygon' | 'Circle';
  source?: string;
  freehand?: boolean;
  snapTolerance?: number;
}

export interface ModifyConfig extends InteractionConfig {
  source?: string;
  snapTolerance?: number;
}

export interface DragAndDropConfig extends InteractionConfig {
  format?: 'GeoJSON' | 'KML' | 'GPX';
  projection?: string;
}

export interface SelectEvent {
  feature: Feature;
  selected: boolean;
}

export interface DrawEndEvent {
  feature: Feature;
  type: string;
}

export interface DrawStartEvent {
  feature: Feature;
}

export interface ModifyEvent {
  features: Feature[];
  type: 'modifystart' | 'modifyend';
}

export interface InteractionState {
  id: string;
  type: InteractionType;
  active: boolean;
}
