import type { Coordinate } from '@angular-helpers/openlayers/core';

export interface EllipseConfig {
  center: Coordinate;
  semiMajor: number;
  semiMinor: number;
  rotation?: number;
}
export interface SectorConfig {
  center: Coordinate;
  radius: number;
  startAngle: number;
  endAngle: number;
}
export interface MilSymbolConfig {
  sidc: string;
  position: Coordinate;
}
