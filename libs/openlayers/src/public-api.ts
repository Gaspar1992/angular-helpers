/**
 * @angular-helpers/openlayers
 *
 * Modular, Signals-first Angular wrapper for OpenLayers.
 * To maximize tree-shaking efficiency and maintain clean bundle boundaries,
 * import components, directives, and services from their dedicated sub-entry points:
 *
 * - `@angular-helpers/openlayers/core`: Root `<ol-map>`, `provideOpenLayers`, `OlMapService`, `OlZoneHelper`, etc.
 * - `@angular-helpers/openlayers/layers`: `<ol-tile-layer>`, `<ol-vector-layer>`, WebGL shaders, etc.
 * - `@angular-helpers/openlayers/controls`: Zoom, scale line, fullscreen, HUD controls.
 * - `@angular-helpers/openlayers/interactions`: Draw, select, modify, translate interactions.
 * - `@angular-helpers/openlayers/overlays`: Popups and coordinate-pinned marker overlays.
 * - `@angular-helpers/openlayers/testing`: Test harnesses and mock OpenLayers providers.
 */

export const OPENLAYERS_SUB_ENTRY_POINTS = [
  '@angular-helpers/openlayers/core',
  '@angular-helpers/openlayers/layers',
  '@angular-helpers/openlayers/controls',
  '@angular-helpers/openlayers/interactions',
  '@angular-helpers/openlayers/overlays',
  '@angular-helpers/openlayers/testing',
] as const;

export type OpenLayersSubEntryPoint = (typeof OPENLAYERS_SUB_ENTRY_POINTS)[number];
