// Public types for @angular-helpers/openlayers/military

import type { Coordinate } from '@angular-helpers/openlayers/core';

/**
 * Subset of `milsymbol`'s `SymbolOptions` exposed by this package.
 * `sidc` is the only required field; everything else is optional and
 * forwarded verbatim to `new Symbol(sidc, options)`.
 */
export interface MilSymbolConfig {
  /** MIL-STD-2525 SIDC code. Required. */
  sidc: string;
  /** Symbol position as `[lon, lat]` in EPSG:4326. Required. */
  position: Coordinate;
  /** Symbol size in pixels. Default (set by `milsymbol`): 30. */
  size?: number;
  /** Mono-color override (e.g. `'#000'`). */
  monoColor?: string;
  /** Outline color. */
  outlineColor?: string;
  /** Icon (interior glyph) color. */
  iconColor?: string;
  /** Additional information field (top of the symbol). */
  additionalInformation?: string;
  /** Staff comments field. */
  staffComments?: string;
  /** Quantity field. */
  quantity?: number;
  /** Unique designation field (unit identifier). */
  uniqueDesignation?: string;
  /** Custom feature properties merged into the output feature's `properties`. */
  properties?: Record<string, unknown>;
}

/**
 * Result of resolving a `MilSymbolConfig` against `milsymbol`. Embedded
 * into the output feature's `style.icon` so that `<ol-vector-layer>` can
 * render it as an `ol/style/Icon`.
 */
export interface MilSymbolStyleResult {
  /** `data:image/svg+xml;base64,...` URL produced from `Symbol.asSVG()`. */
  src: string;
  /** Pixel `[width, height]` from `Symbol.getSize()`. */
  size: [number, number];
  /**
   * Anchor in fractional coordinates `[x, y]` (0..1), computed from
   * `Symbol.getAnchor()` divided by the size. `[0.5, 0.5]` centers the
   * icon on the feature.
   */
  anchor: [number, number];
}
