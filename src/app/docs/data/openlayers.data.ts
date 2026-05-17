import { ServiceDoc } from '../models/doc-meta.model';

export const OPENLAYERS_SERVICES: ServiceDoc[] = [
  {
    id: 'map',
    name: 'OlMapComponent',
    description:
      'Root component for OpenLayers maps. Manages the map instance, view state, and provides dependency injection context for all child components.',
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
    ],
    outputs: [],
    methods: [],
    example: `import { OlVectorLayerComponent, OlClusterComponent } from '@angular-helpers/openlayers/layers';

@Component({
  template: \`
    <ol-map>
      <ol-vector-layer id="locations" [features]="locations()">
        <ol-cluster [distance]="55" [minDistance]="20" [showCount]="true" />
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
];
