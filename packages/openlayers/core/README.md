# @angular-helpers/openlayers/core

Core library for Angular bindings to OpenLayers.
Provides essential models, services, and the base `<ol-map>` component.

## Installation

\`\`\`bash
npm install @angular-helpers/openlayers
\`\`\`

## Core Services & Components

- \`OlMapComponent\`: The root map component that manages the core OpenLayers `Map` instance.
- \`OlMapService\`: A service to retrieve and manage the map instance across child components.
- \`OlLayerService\`: Manages map layers dynamically.
- \`OlZoneHelper\`: Optimizes Angular change detection around OpenLayers events.

## Usage

\`\`\`typescript
import { Component } from '@angular/core';
import { OlMapComponent } from '@angular-helpers/openlayers';
import { OlTileLayerComponent } from '@angular-helpers/openlayers/layers';

@Component({
selector: 'app-map-demo',
imports: [OlMapComponent, OlTileLayerComponent],
template: \`
<ol-map [center]="[0, 0]" [zoom]="4" class="map-container">
<ol-tile-layer source="osm"></ol-tile-layer>
</ol-map>
\`,
styles: [\`
.map-container {
width: 100%;
height: 400px;
display: block;
}
\`]
})
export class MapDemoComponent {}
\`\`\`
