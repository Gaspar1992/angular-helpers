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
    ],
    category: 'ol-core',
    methods: [
      {
        name: 'getMap',
        signature: 'getMap(): Map | null',
        description: 'Returns the underlying OpenLayers Map instance.',
        returns: 'Map | null',
      },
      {
        name: 'setView',
        signature: 'setView(view: View): void',
        description: 'Sets a new view for the map.',
        returns: 'void',
      },
    ],
    example: `import { OlMapComponent } from '@angular-helpers/openlayers';

@Component({
  imports: [OlMapComponent, OlTileLayerComponent, OlZoomControlComponent],
  template: \`
    <ah-ol-map [center]="[0, 0]" [zoom]="2">
      <ah-ol-tile-layer />
      <ah-ol-zoom-control />
    </ah-ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'view',
    name: 'OlViewDirective',
    description:
      'Directive to configure the map view, including center, zoom, rotation, and projection.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Can be used as directive or configured via OlMapComponent inputs.'],
    category: 'ol-core',
    methods: [
      {
        name: 'fit',
        signature: 'fit(extent: Extent, options?: FitOptions): void',
        description: 'Fits the view to a given extent.',
        returns: 'void',
      },
      {
        name: 'animate',
        signature: 'animate(...animations: AnimationOptions[]): Promise<void>',
        description: 'Animates the view with one or more animations.',
        returns: 'Promise<void>',
      },
    ],
    example: `import { OlViewDirective } from '@angular-helpers/openlayers';

@Component({
  template: \`
    <ah-ol-map>
      <div ahOlView [center]="center()" [zoom]="zoom()"></div>
    </ah-ol-map>
  \`
})
export class MapComponent {
  center = signal([0, 0]);
  zoom = signal(2);
}`,
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
    methods: [
      {
        name: 'setSource',
        signature: 'setSource(source: TileSource): void',
        description: 'Sets a new tile source for the layer.',
        returns: 'void',
      },
      {
        name: 'setOpacity',
        signature: 'setOpacity(opacity: number): void',
        description: 'Sets the layer opacity (0-1).',
        returns: 'void',
      },
    ],
    example: `import { OlTileLayerComponent } from '@angular-helpers/openlayers';

@Component({
  template: \`
    <ah-ol-map>
      <!-- OSM default -->
      <ah-ol-tile-layer />
      
      <!-- Custom XYZ source -->
      <ah-ol-tile-layer 
        [url]="'https://example.com/tiles/{z}/{x}/{y}.png'"
        [attribution]="'© Custom Tiles'" />
    </ah-ol-map>
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
    methods: [
      {
        name: 'addFeature',
        signature: 'addFeature(feature: Feature): void',
        description: 'Adds a feature to the layer.',
        returns: 'void',
      },
      {
        name: 'removeFeature',
        signature: 'removeFeature(feature: Feature): void',
        description: 'Removes a feature from the layer.',
        returns: 'void',
      },
      {
        name: 'clear',
        signature: 'clear(): void',
        description: 'Removes all features from the layer.',
        returns: 'void',
      },
    ],
    example: `import { OlVectorLayerComponent } from '@angular-helpers/openlayers/layers';

@Component({
  template: \`
    <ah-ol-map>
      <ah-ol-tile-layer />
      <ah-ol-vector-layer [features]="features()" [style]="pointStyle" />
    </ah-ol-map>
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
    methods: [],
    example: `import { OlZoomControlComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ah-ol-map>
      <ah-ol-tile-layer />
      <ah-ol-zoom-control [delta]="1" class="top-4 right-4" />
    </ah-ol-map>
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
    methods: [
      {
        name: 'setCollapsed',
        signature: 'setCollapsed(collapsed: boolean): void',
        description: 'Sets whether the attribution is collapsed.',
        returns: 'void',
      },
    ],
    example: `import { OlAttributionControlComponent } from '@angular-helpers/openlayers/controls';

@Component({
  template: \`
    <ah-ol-map>
      <ah-ol-tile-layer />
      <ah-ol-attribution-control [collapsed]="false" />
    </ah-ol-map>
  \`
})
export class MapComponent {}`,
  },
  {
    id: 'select-interaction',
    name: 'OlSelectInteractionComponent',
    description:
      'Interaction component for selecting features. Emits selection changes via output.',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/interactions',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Works with any vector layer', 'Supports multi-select with modifier keys.'],
    category: 'ol-interactions',
    methods: [],
    example: `import { OlSelectInteractionComponent } from '@angular-helpers/openlayers/interactions';

@Component({
  template: \`
    <ah-ol-map>
      <ah-ol-tile-layer />
      <ah-ol-vector-layer [features]="features()" />
      <ah-ol-select-interaction 
        (select)="onSelect($event)" />
    </ah-ol-map>
  \`
})
export class MapComponent {
  onSelect(event: SelectEvent) {
    console.log('Selected:', event.selected);
  }
}`,
  },
  {
    id: 'draw-interaction',
    name: 'OlDrawInteractionComponent',
    description: 'Interaction component for drawing geometries (Point, LineString, Polygon).',
    scope: 'component',
    importPath: '@angular-helpers/openlayers/interactions',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Drawn features are automatically added to the target layer',
      'Supports freehand drawing mode.',
    ],
    category: 'ol-interactions',
    methods: [
      {
        name: 'setActive',
        signature: 'setActive(active: boolean): void',
        description: 'Activates or deactivates the drawing interaction.',
        returns: 'void',
      },
      {
        name: 'finishDrawing',
        signature: 'finishDrawing(): void',
        description: 'Finishes the current drawing.',
        returns: 'void',
      },
    ],
    example: `import { OlDrawInteractionComponent } from '@angular-helpers/openlayers/interactions';

@Component({
  template: \`
    <ah-ol-map>
      <ah-ol-tile-layer />
      <ah-ol-vector-layer #drawLayer />
      <ah-ol-draw-interaction 
        type="Polygon"
        [targetLayer]="drawLayer"
        (drawend)="onDrawEnd($event)" />
    </ah-ol-map>
  \`
})
export class MapComponent {
  onDrawEnd(event: DrawEvent) {
    console.log('Drew:', event.feature);
  }
}`,
  },
];
