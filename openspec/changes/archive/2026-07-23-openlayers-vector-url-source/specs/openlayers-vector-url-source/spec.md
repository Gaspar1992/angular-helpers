# Specification: OpenLayers Vector URL Source (openlayers-vector-url-source)

## Requirements

1. **Unified Configuration**: The system MUST support a unified `VectorSourceConfig` interface that contains optional `features`, `url`, `format`, `coordinateProjection`, `autoFit`, `onError`, `onFeaturesLoaded`, and `throttleTime` properties.
2. **Input Compatibility**: The `OlVectorLayerComponent` and `OlWebGLVectorLayerComponent` components MUST accept a `source` input. The `source` input SHALL accept a URL string, a static array of `Feature[]` objects, or a `VectorSourceConfig` object.
3. **Format Projection Mapping**: When instantiating built-in formats (e.g., GeoJSON, TopoJSON, KML), the system MUST pass the configured `coordinateProjection` as the `dataProjection` option to the format constructor (e.g., `new GeoJSON({ dataProjection: sourceProj, featureProjection: targetProj })`) to ensure correct coordinate decoding.
4. **Auto-Fit Behavior**:
   - For remote URL sources, the system MUST trigger auto-fitting only after features finish loading (on the `featuresloadend` event).
   - For static feature arrays, the system MUST trigger auto-fitting immediately.
5. **Event Zone Isolation**: The `onError` and `onFeaturesLoaded` callbacks MUST execute outside the Angular Zone (`NgZone.runOutsideAngular`) by default to prevent unnecessary change detection cycles.
6. **Reactive Source Cleanup**: When the `source` input changes reactively, the system MUST cleanly dispose of the old vector source by invoking `clear(true)` and `dispose()` to prevent memory and WebGL context leaks.

## Scenarios

### Scenario: Input signature resolution

```gherkin
Given an OlVectorLayerComponent or OlWebGLVectorLayerComponent instance
When a source input is provided as a string URL
Then the system MUST treat it as a VectorSourceConfig with the url set to that string and format defaulted to GeoJSON
When a source input is provided as a static Feature[] array
Then the system MUST treat it as a VectorSourceConfig with the features property set to that array
When a source input is provided as a VectorSourceConfig object
Then the system MUST use the configuration object as is
```

### Scenario: Built-in format projection mapping

```gherkin
Given a VectorSourceConfig with format set to "geojson" and coordinateProjection set to "EPSG:4326"
When the vector source is instantiated by the layer service
Then the service MUST construct the GeoJSON format instance passing the dataProjection option
And the format constructor option MUST match the specified coordinateProjection
```

### Scenario: Auto-fit timing for remote vs static sources

```gherkin
Given a vector layer configured with autoFit enabled
When the source is static (defined via features array)
Then the system MUST fit the map view to the features' extent immediately
When the source is remote (defined via url)
Then the system MUST NOT fit the map view immediately
And the system MUST listen for the featuresloadend event
And the system MUST fit the map view to the features' extent only after the event fires
```

### Scenario: Callback execution outside NgZone

```gherkin
Given a VectorSourceConfig with custom onError or onFeaturesLoaded callbacks
When features are successfully loaded or a load error occurs
Then the callbacks MUST be executed
And the callbacks MUST run outside the Angular Zone by default
```

### Scenario: Clean disposal of replaced vector sources

```gherkin
Given a vector layer component with an active vector source
When the source input changes reactively to a new configuration
Then the system MUST initialize the new source configuration
And the system MUST call clear(true) and dispose() on the old vector source
And any WebGL layer context associated with the old source MUST be cleaned up to prevent leaks
```
