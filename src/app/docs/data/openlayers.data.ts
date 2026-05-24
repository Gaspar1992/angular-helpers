import { ServiceDoc } from '../models/doc-meta.model';

export const OPENLAYERS_SERVICES: ServiceDoc[] = [
  {
    id: 'map',
    name: 'OlMapComponent',
    description:
      'Root component for <a href="https://openlayers.org/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">OpenLayers</a> maps. Manages the map instance, view state, and provides dependency injection context for all child components.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Must wrap all other OpenLayers components',
      'Automatically cleans up map instance on destroy',
      'Requires OpenLayers CSS: import "ol/ol.css" in your global styles',
    ],
    category: 'ol-core',
    inputs: [
      {
        name: 'center',
        type: 'Coordinate',
        defaultValue: '[0, 0]',
        description: 'Initial map center as [longitude, latitude]',
      },
      { name: 'zoom', type: 'number', defaultValue: '0', description: 'Initial zoom level' },
      {
        name: 'rotation',
        type: 'number',
        defaultValue: '0',
        description: 'Map rotation in radians (clockwise)',
      },
      {
        name: 'projection',
        type: 'string',
        defaultValue: 'EPSG:3857',
        description: 'Projection code for the map view',
      },
    ],
    outputs: [
      {
        name: 'viewChange',
        type: 'ViewState',
        description: 'Emitted when the view changes (center, zoom, or rotation)',
      },
      { name: 'mapClick', type: 'MapClickEvent', description: 'Emitted when the map is clicked' },
      {
        name: 'mapDblClick',
        type: 'MapClickEvent',
        description: 'Emitted when the map is double-clicked',
      },
    ],
    methods: [],
    example: `import { OlMapComponent } from '@angular-helpers/openlayers';

@Component({
  imports: [OlMapComponent, OlTileLayerComponent, OlZoomControlComponent],
  template: \`
    <ol-map>
      <ol-tile-layer />
      <ol-zoom-control />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'tile-layer',
    name: 'OlTileLayerComponent',
    description:
      'Component for tile-based map layers. Supports various tile sources like OSM, XYZ, WMTS, and WMS.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Default source is OpenStreetMap', 'Supports custom XYZ and WMS sources via inputs.'],
    category: 'ol-layers',
    inputs: [
      { name: 'id', type: 'string', description: 'Unique identifier for the layer (required)' },
      { name: 'source', type: "'osm' | 'xyz' | 'wms'", description: 'Tile source type (required)' },
      { name: 'url', type: 'string', description: 'URL template for XYZ or WMS sources' },
      {
        name: 'attributions',
        type: 'string | string[]',
        description: 'Attribution text for the layer source',
      },
      {
        name: 'params',
        type: 'Record<string, unknown>',
        description: 'Additional parameters for WMS sources',
      },
      { name: 'zIndex', type: 'number', defaultValue: '0', description: 'Layer stacking order' },
      { name: 'opacity', type: 'number', defaultValue: '1', description: 'Layer opacity (0-1)' },
      {
        name: 'visible',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether the layer is visible',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlTileLayerComponent } from '@angular-helpers/openlayers';

@Component({
  template: \`
    <ol-map>
      <!-- OSM default -->
      <ol-tile-layer source="osm" />

      <!-- Custom XYZ source -->
      <ol-tile-layer
        source="xyz"
        url="https://example.com/tiles/{z}/{x}/{y}.png"
        [attributions]="'© Custom Tiles'" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'vector-layer',
    name: 'OlVectorLayerComponent',
    description:
      'Component for vector layers with reactive feature management. Supports GeoJSON, drawing, and selection.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/layers',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Features can be bound via signal inputs',
      'Supports reactive styling with style functions.',
    ],
    category: 'ol-layers',
    inputs: [
      { name: 'id', type: 'string', description: 'Unique identifier for the layer (required)' },
      {
        name: 'features',
        type: 'Feature[]',
        defaultValue: '[]',
        description: 'Array of features to display',
      },
      { name: 'zIndex', type: 'number', defaultValue: '0', description: 'Layer stacking order' },
      { name: 'opacity', type: 'number', defaultValue: '1', description: 'Layer opacity (0-1)' },
      {
        name: 'visible',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether the layer is visible',
      },
      {
        name: 'style',
        type: 'Style | (feature: Feature) => Style',
        description: 'Style or style function for features',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlVectorLayerComponent } from '@angular-helpers/openlayers/layers';

@Component({
  template: \`
    <ol-map>
      <ol-tile-layer source="osm" />
      <ol-vector-layer [features]="features()" [style]="pointStyle" />
    </ol-map>
  \`
})
export class MapComponent {
  features = signal([
    new Feature(new Point([0, 0]))
  ]);
  
  pointStyle = new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({ color: 'red' })
    })
  });
}`,
  },
  {
    id: 'zoom-control',
    name: 'OlZoomControlComponent',
    description: 'Zoom in/out control component with customizable styling and delta values.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/controls',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Can be positioned via CSS or class inputs.'],
    category: 'ol-controls',
    inputs: [
      {
        name: 'delta',
        type: 'number',
        defaultValue: '1',
        description: 'Zoom delta (amount to zoom in/out per click)',
      },
      {
        name: 'duration',
        type: 'number',
        defaultValue: '250',
        description: 'Animation duration in milliseconds',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlZoomControlComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ol-map>
      <ol-tile-layer source="osm" />
      <ol-zoom-control [delta]="1" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'attribution-control',
    name: 'OlAttributionControlComponent',
    description:
      'Attribution control that displays layer source attributions. Collapsible by default.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/controls',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Automatically collects attributions from all visible layers.'],
    category: 'ol-controls',
    inputs: [
      {
        name: 'collapsible',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether the attribution can be collapsed',
      },
      {
        name: 'collapsed',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether the attribution starts collapsed',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlAttributionControlComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ol-map>
      <ol-tile-layer source="osm" />
      <ol-attribution-control [collapsed]="false" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'scale-line-control',
    name: 'OlScaleLineControlComponent',
    description:
      'Scale line control that displays the current map scale. Supports metric, imperial, nautical, and US units.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/controls',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Automatically updates as the view changes', 'Can display as a bar or text.'],
    category: 'ol-controls',
    inputs: [
      {
        name: 'units',
        type: "'metric' | 'imperial' | 'nautical' | 'us'",
        defaultValue: 'metric',
        description: 'Unit system for the scale',
      },
      {
        name: 'bar',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Whether to show as a scale bar instead of text',
      },
      {
        name: 'steps',
        type: 'number',
        defaultValue: '4',
        description: 'Number of steps for the scale bar',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlScaleLineControlComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ol-map>
      <ol-tile-layer source="osm" />
      <ol-scale-line-control unit="metric" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'fullscreen-control',
    name: 'OlFullscreenControlComponent',
    description:
      'Fullscreen control that toggles the map to fullscreen mode. Supports custom labels and tooltips.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/controls',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Can target a specific element or the entire map',
      'Customizable labels for active/inactive states.',
    ],
    category: 'ol-controls',
    inputs: [
      {
        name: 'source',
        type: 'HTMLElement',
        description: 'Element to make fullscreen (defaults to map element)',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: '⤢',
        description: 'Label for the fullscreen button',
      },
      {
        name: 'labelActive',
        type: 'string',
        defaultValue: '⤡',
        description: 'Label when in fullscreen mode',
      },
      {
        name: 'tipLabel',
        type: 'string',
        defaultValue: 'Toggle full-screen',
        description: 'Tooltip text for the button',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlFullscreenControlComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ol-map>
      <ol-tile-layer source="osm" />
      <ol-fullscreen-control label="[+]" labelActive="[-]" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'heatmap-layer',
    name: 'OlHeatmapLayerComponent',
    description:
      'Component for GPU-accelerated heatmap rendering of vector points. Features zoom-aware radius and blur scaling.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/layers',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Supports reactive inputs for live property updates',
      'Can define radius and blur in physical "meters" or screenspace "pixels"',
      'Resolution-aware scaling automatically scales meters-based parameters with zoom',
    ],
    category: 'ol-layers',
    inputs: [
      { name: 'id', type: 'string', description: 'Unique identifier for the layer (required)' },
      {
        name: 'features',
        type: 'Feature[]',
        defaultValue: '[]',
        description: 'Array of features to display',
      },
      { name: 'zIndex', type: 'number', defaultValue: '0', description: 'Layer stacking order' },
      { name: 'opacity', type: 'number', defaultValue: '1', description: 'Layer opacity (0-1)' },
      {
        name: 'visible',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether the layer is visible',
      },
      { name: 'blur', type: 'number', defaultValue: '15', description: 'Blur size' },
      { name: 'radius', type: 'number', defaultValue: '8', description: 'Radius size' },
      {
        name: 'radiusUnit',
        type: "'pixels' | 'meters'",
        defaultValue: 'pixels',
        description: 'Unit system for radius and blur calculation',
      },
      {
        name: 'weight',
        type: 'string | ((f: Feature) => number)',
        description: 'Feature weight property or evaluator function',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlHeatmapLayerComponent } from '@angular-helpers/openlayers/layers';

@Component({
  template: \`
    <ol-map [center]="[2.17, 41.38]" [zoom]="12">
      <ol-heatmap-layer
        id="earthquakes"
        [features]="earthquakes()"
        [radius]="1000"
        radiusUnit="meters"
        [blur]="1500" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'cluster',
    name: 'OlClusterComponent',
    description:
      'Sub-component for clustering vector features under a vector layer. Aggregates nearby points into styled cluster markers.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/layers',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Must be projected inside <ol-vector-layer>',
      'Automatically collects points and calculates cluster sizes',
      'Can display feature count text inside the cluster markers',
    ],
    category: 'ol-layers',
    inputs: [
      {
        name: 'distance',
        type: 'number',
        defaultValue: '40',
        description: 'Distance in pixels within which features will be clustered',
      },
      {
        name: 'minDistance',
        type: 'number',
        defaultValue: '20',
        description: 'Minimum distance in pixels between clusters',
      },
      {
        name: 'showCount',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether to show the clustered feature count',
      },
      { name: 'featureStyle', type: 'Style', description: 'Custom style for the cluster markers' },
      {
        name: 'spiderfyOnSelect',
        type: 'boolean',
        defaultValue: 'false',
        description:
          'Whether to spiderfy the cluster on click (expanding overlapping features radially)',
      },
    ],
    outputs: [
      {
        name: 'spiderfyClick',
        type: 'Feature',
        description: 'Emitted when an individual feature within a spiderfied cluster is clicked',
      },
    ],
    methods: [],
    example: `import { OlVectorLayerComponent, OlClusterComponent } from '@angular-helpers/openlayers/layers';

@Component({
  template: \`
    <ol-map>
      <ol-vector-layer id="locations" [features]="locations()">
        <ol-cluster 
          [distance]="55" 
          [minDistance]="20" 
          [showCount]="true"
          [spiderfyOnSelect]="true"
          (spiderfyClick)="onFeatureClick($event)" />
      </ol-vector-layer>
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'layer-switcher',
    name: 'OlLayerSwitcherComponent',
    description:
      'Interactive overlay control allowing users to dynamically toggle the visibility and adjust the opacity of active layers.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/controls',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Can be positioned at any corner of the viewport',
      'Supports layer type-badges (vector, tile, image)',
      'Optional opacity slider for each active layer',
    ],
    category: 'ol-controls',
    inputs: [
      {
        name: 'position',
        type: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
        defaultValue: 'top-right',
        description: 'Placement on the map layout',
      },
      {
        name: 'layers',
        type: 'LayerSwitcherItem[]',
        defaultValue: '[]',
        description: 'List of manageable layers',
      },
      {
        name: 'collapsible',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether the control panel can collapse',
      },
      {
        name: 'showOpacity',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Whether to display layer opacity range inputs',
      },
      {
        name: 'startCollapsed',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Whether switcher starts collapsed',
      },
    ],
    outputs: [
      {
        name: 'visibilityChange',
        type: '{ id: string; visible: boolean }',
        description: 'Emitted when a layer visibility is toggled',
      },
      {
        name: 'opacityChange',
        type: '{ id: string; opacity: number }',
        description: 'Emitted when a layer opacity is adjusted',
      },
    ],
    methods: [],
    example: `import { OlLayerSwitcherComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ol-map>
      <ol-layer-switcher
        position="top-right"
        [layers]="layersList()"
        [showOpacity]="true"
        (visibilityChange)="onVisibility($event)" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'basemap-switcher',
    name: 'OlBasemapSwitcherComponent',
    description:
      'Interactive basemap switcher control allowing users to switch between different base tile providers dynamically.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/controls',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Swaps out the visible base layer dynamically without recreating the map component',
      'Supports custom icons, names, and tile configurations',
      'Positioning options support centering (top-center, bottom-center) for responsive mobile/desktop UX',
    ],
    category: 'ol-controls',
    inputs: [
      {
        name: 'basemaps',
        type: 'BasemapConfig[]',
        defaultValue: "[{ id: 'osm', name: 'OpenStreetMap', type: 'osm' }]",
        description: 'Available basemap configurations',
      },
      {
        name: 'activeBasemap',
        type: 'string',
        defaultValue: 'osm',
        description: 'Active basemap configuration ID',
      },
      {
        name: 'position',
        type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
        defaultValue: 'bottom-left',
        description: 'Placement on the map layout',
      },
    ],
    outputs: [
      {
        name: 'basemapChange',
        type: 'string',
        description: 'Emitted with the new active basemap ID when chosen',
      },
    ],
    methods: [],
    example: `import { OlBasemapSwitcherComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ol-map>
      <ol-basemap-switcher
        position="bottom-left"
        [basemaps]="baseLayers"
        [activeBasemap]="activeBase"
        (basemapChange)="onBaseChange($event)" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'webgl-tile-layer',
    name: 'OlWebGLTileLayerComponent',
    description:
      'GPU-accelerated tile layer supporting standard XYZ, OSM, and MVT sources with dynamic style expressions for real-time color manipulation.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/layers',
    requiresSecureContext: false,
    browserSupport: 'All WebGL-compatible browsers',
    notes: [
      'Executes all raster rendering operations directly on the GPU.',
      'Supports the dynamic application of WebGL tile styles (raster expressions) for color manipulation (brightness, contrast, saturation, gamma).',
      'Provides high performance rendering for heavy tile configurations.',
    ],
    category: 'ol-layers',
    inputs: [
      { name: 'id', type: 'string', description: 'Unique identifier for the layer (required)' },
      { name: 'source', type: "'osm' | 'xyz' | 'mvt'", description: 'Tile source type (required)' },
      { name: 'url', type: 'string', description: 'URL template for custom tile sources' },
      {
        name: 'attributions',
        type: 'string | string[]',
        description: 'Attribution texts for this layer',
      },
      {
        name: 'tileStyle',
        type: 'WebGLTileStyle | FlatStyleLike',
        description: 'Raster style expressions or MVT flat styles',
      },
      { name: 'zIndex', type: 'number', defaultValue: '0', description: 'Layer stack order' },
      { name: 'opacity', type: 'number', defaultValue: '1', description: 'Layer opacity (0-1)' },
      { name: 'visible', type: 'boolean', defaultValue: 'true', description: 'Layer visibility' },
      {
        name: 'preload',
        type: 'number',
        defaultValue: '0',
        description: 'Preload low-res tiles zoom level',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlWebGLTileLayerComponent } from '@angular-helpers/openlayers/layers';

@Component({
  template: \`
    <ol-map>
      <ol-webgl-tile-layer
        id="satellite"
        source="xyz"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        [tileStyle]="{ brightness: 0.1, contrast: 0.2 }" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'webgl-vector-layer',
    name: 'OlWebGLVectorLayerComponent',
    description:
      'GPU-accelerated vector layer engineered to display massive datasets (10,000+ features) smoothly using WebGL 2.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/layers',
    requiresSecureContext: false,
    browserSupport: 'All WebGL-compatible browsers',
    notes: [
      'Engineered specifically to render huge coordinate datasets without lagging the browser thread.',
      'Must use FlatStyleLike configurations for styling (instead of standard ol/style/Style objects).',
      'Memory is fully released on destroy by executing rigorous WebGL buffer cleanup.',
    ],
    category: 'ol-layers',
    inputs: [
      { name: 'id', type: 'string', description: 'Unique identifier for the layer (required)' },
      {
        name: 'features',
        type: 'Feature[]',
        defaultValue: '[]',
        description: 'Array of coordinates/shapes to render',
      },
      {
        name: 'flatStyle',
        type: 'FlatStyleLike',
        description: 'WebGL flat style declaration (required)',
      },
      { name: 'zIndex', type: 'number', defaultValue: '0', description: 'Layer stack order' },
      { name: 'opacity', type: 'number', defaultValue: '1', description: 'Layer opacity (0-1)' },
      { name: 'visible', type: 'boolean', defaultValue: 'true', description: 'Layer visibility' },
      {
        name: 'disableHitDetection',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Disable mouse hit testing for peak performance',
      },
      {
        name: 'variables',
        type: 'Record<string, unknown>',
        description: 'Style variables for real-time dynamic rendering updates',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlWebGLVectorLayerComponent } from '@angular-helpers/openlayers/layers';

@Component({
  template: \`
    <ol-map>
      <ol-webgl-vector-layer
        id="large-data"
        [features]="densePoints()"
        [flatStyle]="pointStyle"
        [disableHitDetection]="true" />
    </ol-map>
  \`
})
export class MapComponent {
  pointStyle = {
    'circle-radius': 6,
    'circle-fill-color': '#10b981',
    'stroke-color': '#334155',
    'stroke-width': 1
  };
}`,
  },
  {
    id: 'popup',
    name: 'OlPopupComponent',
    description:
      'Declarative popup overlay component displaying custom Angular templates projected over specific coordinates on the map.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/overlays',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Appends directly into the <a href="https://openlayers.org/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">OpenLayers</a> Overlay viewport while remaining completely connected to Angular\'s component tree.',
      'Supports auto-pan, customizable offsets, and programmatic closure with leak-free component destruction.',
    ],
    category: 'ol-overlays',
    inputs: [
      {
        name: 'position',
        type: 'Coordinate | null',
        defaultValue: 'null',
        description: 'Map coordinate to anchor popup. Set null to hide.',
      },
      {
        name: 'offset',
        type: '[number, number]',
        defaultValue: '[0, 0]',
        description: 'Pixel offset relative to coordinate',
      },
      {
        name: 'positioning',
        type: 'OverlayPositioning',
        defaultValue: "'bottom-center'",
        description: 'Anchor point of popup box',
      },
      {
        name: 'autoPan',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Auto-pan map view to keep popup visible',
      },
      {
        name: 'closeButton',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Render default top-right close cross icon',
      },
    ],
    outputs: [
      {
        name: 'closed',
        type: 'void',
        description:
          'Emitted when popup transitions from visible to hidden or close button clicked',
      },
    ],
    methods: [],
    example: `import { OlPopupComponent } from '@angular-helpers/openlayers/overlays';

@Component({
  template: \`
    <ol-map>
      <ol-popup
        [position]="selectedCoord()"
        [closeButton]="true"
        [autoPan]="true"
        (closed)="onPopupClosed()">
        <h3>Feature Details</h3>
        <p>Dynamic data is reactively rendered inside the map container.</p>
      </ol-popup>
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'tooltip',
    name: 'OlTooltipDirective',
    description:
      'Declarative hover directive displaying floating text tooltips when the cursor points to vector layer features.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/overlays',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Runs internally outside Angular zone (runOutsideAngular) to avoid performance impacts on mouse pointer moves.',
      'Customizable styles can override the .ol-tooltip class hook in your global styling rules.',
    ],
    category: 'ol-overlays',
    inputs: [
      {
        name: 'olTooltip',
        type: 'string',
        description: 'Feature property key to read and render in the tooltip (required)',
      },
      {
        name: 'olTooltipLayer',
        type: 'string | null',
        defaultValue: 'null',
        description: 'Limit tooltip detection to a single layer by id',
      },
    ],
    outputs: [],
    methods: [],
    example: `import { OlTooltipDirective } from '@angular-helpers/openlayers/overlays';

@Component({
  template: \`
    <ol-map>
      <ol-vector-layer
        id="pois"
        [features]="poisList()"
        olTooltip="name"
        olTooltipLayer="pois" />
    </ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'military',
    name: 'OlMilitaryService',
    description:
      'Service providing dynamic military symbology (MIL-STD-2525 / APP-6) rendering utilizing the <a href="https://openlayers.org/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">OpenLayers</a> framework and the <a href="https://github.com/spatialillusions/milsymbol" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">milsymbol</a> library.',
    scope: 'provided',
    importPath: '@angular-helpers/openlayers/military',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Uses dynamic Angular resources (resource API) to lazy-load the heavy milsymbol package asynchronously.',
      'Acts as a pure symbol renderer, delegating geographic calculations to specialized services.',
    ],
    category: 'ol-military',
    inputs: [],
    outputs: [],
    methods: [
      {
        name: 'preloadMilsymbol',
        signature: '(): Promise<void>',
        description: 'Triggers preloading of the milsymbol JS bundle',
        returns: 'Promise<void>',
      },
      {
        name: 'createMilSymbol',
        signature: '(config: MilSymbolConfig): Promise<Feature>',
        description: 'Creates a point MIL-STD-2525 symbol asynchronously',
        returns: 'Promise<Feature>',
      },
      {
        name: 'createMilSymbolSync',
        signature: '(config: MilSymbolConfig): Feature',
        description: 'Creates a symbol synchronously (throws if bundle not loaded yet)',
        returns: 'Feature',
      },
    ],
    example: `import { OlMilitaryService } from '@angular-helpers/openlayers/military';

@Component({
  providers: [OlMilitaryService],
  template: \`
    <ol-map>
      <ol-vector-layer id="mil-graphics" [features]="militarySymbols()" />
    </ol-map>
  \`
})
export class MapComponent {
  private milSvc = inject(OlMilitaryService);
  militarySymbols = signal<Feature[]>([]);

  constructor() {
    this.milSvc.createMilSymbol({
      sidc: 'SFGPUCI---*****', // Friendly Infantry Unit
      position: [2.17, 41.38]
    }).then(sym => {
      this.militarySymbols.set([sym]);
    });
  }
}`,
  },
  {
    id: 'geometry',
    name: 'OlGeometryService',
    description:
      'Service providing geodesic precision mathematical helpers to build approximated polygons (ellipses, circular sectors, donuts) using true geodesic calculations.',
    scope: 'provided',
    importPath: '@angular-helpers/openlayers/core',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Approximates standard shapes in metric spaces while preventing map projection scale distortions.',
      "Computes ring vertices using Vincenty's formulae geodesic math via ol/sphere.",
      'Highly optimized to compute coordinates outside the standard Angular zone when required.',
    ],
    category: 'ol-core',
    inputs: [],
    outputs: [],
    methods: [
      {
        name: 'createEllipse',
        signature: '(config: EllipseConfig): Feature',
        description: 'Generates an ellipsoid polygon shape with geodesic math',
        returns: 'Feature',
      },
      {
        name: 'createSector',
        signature: '(config: SectorConfig): Feature',
        description: 'Generates a pie sector polygon with geodesic math',
        returns: 'Feature',
      },
      {
        name: 'createDonut',
        signature: '(config: DonutConfig): Feature',
        description: 'Generates a donut polygon shape with geodesic math',
        returns: 'Feature',
      },
      {
        name: 'offsetMetersToLonLat',
        signature: '(center: Coordinate, dx: number, dy: number): Coordinate',
        description:
          'Projects a meter offset from a coordinate into lon/lat using true geodesic math',
        returns: 'Coordinate',
      },
    ],
    example: `import { OlGeometryService } from '@angular-helpers/openlayers/core';

@Component({
  template: \`
    <ol-map>
      <ol-vector-layer [features]="shapes()" />
    </ol-map>
  \`
})
export class MapComponent {
  private geomSvc = inject(OlGeometryService);
  shapes = signal<Feature[]>([]);

  constructor() {
    const ellipse = this.geomSvc.createEllipse({
      center: [2.17, 41.38],
      semiMajor: 6000,
      semiMinor: 3000,
      rotation: Math.PI / 6
    });
    this.shapes.set([ellipse]);
  }
}`,
  },
  {
    id: 'tactical-graphics',
    name: 'OlTacticalGraphicsService',
    description:
      'Service providing styling engines and geometry builders for military tactical graphics (frontlines, attack vectors, control zones).',
    scope: 'provided',
    importPath: '@angular-helpers/openlayers/military',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Delegates point symbology to OlMilitaryService.',
      'Generates styled frontlines with "teeth", movement direction arrows, and bounded control zones.',
    ],
    category: 'ol-military',
    inputs: [],
    outputs: [],
    methods: [
      {
        name: 'createFrontLine',
        signature: '(coordinates: Coordinate[], direction?: "friendly" | "hostile"): Feature',
        description: 'Generates a tactical frontline feature',
        returns: 'Feature',
      },
      {
        name: 'createAttackArrow',
        signature: '(coordinates: Coordinate[], direction?: "friendly" | "hostile"): Feature',
        description: 'Generates an attack vector arrow shape',
        returns: 'Feature',
      },
      {
        name: 'createControlZone',
        signature: '(coordinates: Coordinate[][], direction?: "friendly" | "hostile"): Feature',
        description: 'Generates a control zone polygon feature',
        returns: 'Feature',
      },
      {
        name: 'createFrontLineStyle',
        signature:
          '(color: string, direction?: "friendly" | "hostile"): (feature: OLFeature) => Style[]',
        description:
          'Builds <a href="https://openlayers.org/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">OpenLayers</a> complex style for frontline teeth rendering',
        returns: 'StyleFunction',
      },
      {
        name: 'createAttackArrowStyle',
        signature: '(color: string): (feature: OLFeature) => Style[]',
        description: 'Builds style for attack directional arrows',
        returns: 'StyleFunction',
      },
    ],
    example: `import { OlTacticalGraphicsService } from '@angular-helpers/openlayers/military';

@Component({
  providers: [OlTacticalGraphicsService],
  template: \`
    <ol-map>
      <ol-vector-layer id="tactical" [features]="graphics()" [style]="tacticalStyle" />
    </ol-map>
  \`
})
export class MapComponent {
  private tacticalSvc = inject(OlTacticalGraphicsService);
  graphics = signal<Feature[]>([]);

  constructor() {
    const frontline = this.tacticalSvc.createFrontLine([
      [2.1, 41.3], [2.2, 41.4]
    ], 'friendly');
    this.graphics.set([frontline]);
  }

  tacticalStyle = this.tacticalSvc.createFrontLineStyle('#4f46e5', 'friendly');
}`,
  },
  {
    id: 'time-service',
    name: 'OlTimeService',
    description:
      'Service providing a high-performance, off-zone animation timing loop (60FPS) using requestAnimationFrame. Essential for running smooth WebGL map animations without triggering global change detection.',
    scope: 'provided',
    importPath: '@angular-helpers/openlayers/core',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Executes timing loop completely outside the Angular Zone.',
      'Exposes read-only reactive signals for current time, speed, and play state.',
      'Bypasses global Change Detection to maintain smooth 60FPS UI performance.',
    ],
    category: 'ol-core',
    inputs: [],
    outputs: [],
    methods: [
      {
        name: 'play',
        signature: '(): void',
        description: 'Starts the animation loop ticks.',
        returns: 'void',
      },
      {
        name: 'pause',
        signature: '(): void',
        description: 'Pauses the animation loop ticks.',
        returns: 'void',
      },
      {
        name: 'stop',
        signature: '(resetTime?: number): void',
        description:
          'Stops the animation loop and resets the time signal to the specified epoch timestamp (defaults to Date.now()).',
        returns: 'void',
      },
      {
        name: 'setTime',
        signature: '(time: number): void',
        description: 'Sets the current timeline epoch timestamp manually.',
        returns: 'void',
      },
      {
        name: 'setSpeed',
        signature: '(speed: number): void',
        description: 'Sets the animation play speed multiplier.',
        returns: 'void',
      },
    ],
    example: `import { OlTimeService } from '@angular-helpers/openlayers/core';

@Component({
  template: \`
    <ol-map>
      <ol-tile-layer source="osm" />
    </ol-map>
  \`
})
export class MapComponent {
  private timeService = inject(OlTimeService);

  startAnimation() {
    this.timeService.setTime(1700000000000);
    this.timeService.setSpeed(60); // 60x real time
    this.timeService.play();
  }
}`,
  },
  {
    id: 'timeline-control',
    name: 'OlTimelineComponent',
    description:
      'A visual playback and scrubbing control for time-series maps. Sleek glassmorphic theme designed specifically to orchestrate animations reactively through <code>OlTimeService</code>.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/controls',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Zero reliance on CommonModule or FormsModule for maximum performance.',
      'Direct range tracking with native elements bypasses heavy forms change detection cycles.',
      'Can be aligned at any corner or center of the viewport.',
    ],
    category: 'ol-controls',
    inputs: [
      {
        name: 'startTime',
        type: 'number',
        description: 'Start bounds of time-series in Epoch milliseconds (required)',
      },
      {
        name: 'endTime',
        type: 'number',
        description: 'End bounds of time-series in Epoch milliseconds (required)',
      },
      {
        name: 'playSpeed',
        type: 'number',
        defaultValue: '1',
        description: 'Initial playback speed multiplier',
      },
      {
        name: 'loop',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Whether to loop animation back to startTime when reaching endTime',
      },
      {
        name: 'position',
        type: 'TimelinePosition',
        defaultValue: "'bottom-center'",
        description: 'Alignment of the timeline control box on the map layout',
      },
      {
        name: 'formatLabel',
        type: '(time: number) => string',
        defaultValue: '(t) => new Date(t).toLocaleString()',
        description: 'Custom formatter callback for the displayed time label',
      },
    ],
    outputs: [
      {
        name: 'timeChange',
        type: 'number',
        description: 'Emitted with the current epoch timestamp as the time advances or scrubs',
      },
      {
        name: 'playStateChange',
        type: 'boolean',
        description: 'Emitted with active state when play/pause is toggled',
      },
    ],
    methods: [],
    example: `import { OlTimelineComponent } from '@angular-helpers/openlayers/controls';

@Component({
  imports: [OlMapComponent, OlTileLayerComponent, OlTimelineComponent],
  template: \`
    <ol-map [center]="[2.17, 41.38]" [zoom]="12">
      <ol-tile-layer source="osm" />
      
      <ol-timeline
        [startTime]="1700000000000"
        [endTime]="1700086400000"
        [playSpeed]="60"
        [loop]="true"
        position="bottom-center"
        (timeChange)="onTimeChange($event)" />
    </ol-map>
  \`
})
export class MapComponent {
  onTimeChange(currentTime: number) {
    console.log('Current animation time:', currentTime);
  }
}`,
  },
];
