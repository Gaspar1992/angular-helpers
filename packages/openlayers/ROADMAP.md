# OpenLayers Ecosystem Roadmap (Phase 3 & Beyond)

This document outlines the planned improvements, known limitations, and feature expansions for the `@angular-helpers/openlayers` package.

## 1. Core Architecture & Performance Improvements

### WebGL Layer Expansions

- **Mapbox Vector Tiles (MVT) Support**: Currently, `OlWebGLTileLayerComponent` supports only `OSM` and `XYZ` (raster sources). Extending it to support `MVT` combined with `ol/format/MVT` will provide massive performance gains for rendering complex city-scale data.
- **WebGL Variables & Interactivity**: The `OlWebGLVectorLayerComponent` needs to support dynamic `variables` in its style definition. This allows for extremely fast hover states (by updating a webgl variable instead of re-evaluating the entire style or re-rendering geometries).

### Remote Data Sources

- **Native Format Decoding**: Add inputs for `url` and `format` to `OlVectorLayerComponent`. Currently, the layer expects an array of pre-parsed `Feature` objects via the `[features]` input. Supporting native `ol/format/GeoJSON` or `TopoJSON` via URLs allows OpenLayers to handle the XHR fetching and parsing off the main thread where possible, reducing Angular change detection overhead for large datasets.

## 2. Advanced Military Features (Phase 3)

### Geodesic-Correct Math

As noted in the documentation, the current geometry helpers (`createEllipse`, `createSector`, `createDonut`) use a local tangent-plane projection. This is fast and accurate for tactical distances (< 100km).
**Improvement**: Introduce geodesic math using `ol/sphere` for these helpers so they remain accurate at massive, strategic scales (e.g., thousands of kilometers or near the poles) where the Earth's curvature causes significant distortion in standard EPSG:3857/4326 planar calculations.

### Advanced Milsymbols Integration

- Implement clustering explicitly aware of military hierarchy (e.g., aggregating squads into platoons visually when zoomed out, based on SIDC properties).

## 3. UI and UX Capabilities

### Advanced Interactions

- **Hover Selection**: Expand `OlSelectInteractionComponent` (and the underlying service) to support `pointerMove` conditions declaratively, enabling hover tooltips and highlighting without custom event bridging.
- **Time-Series / Animation API**: Add an `OlTimeline` component or service to natively animate vector points across a temporal axis, essential for military tracking logs or weather data visualization.

### Projections Support

- **Proj4js Integration**: Add an optional `withProjections()` configuration function for `provideOpenLayers()` that seamlessly registers custom EPSG codes (like UTM zones) using `proj4`, so developers can pass coordinates in local reference systems directly to inputs like `[center]` or `[features]`.

## 4. Known Bugs & Maintenance

- **Component Disposal Audit**: While newer components like `webgl-tile-layer` explicitly call `this.layer.dispose()` on `DestroyRef.onDestroy`, an audit of older components (like basic `vector-layer`) should be performed to ensure they don't just call `map.removeLayer()`, but also correctly dispose of internal sources to free memory.
- **Demo Reusability**: Ensure all demo components strictly rely on internal or standalone imports to prevent `NG1010` and `TS2307` errors when running headless smoke tests (as seen with the `DemoSectionComponent` pathing issues).
