import { MockComponent } from '@angular-helpers/testing';

// This provides a pre-configured mock for the complex OlMapComponent,
// avoiding the need to mock openlayers library internals or deal with ResizeObservers.
export const MockOlMapComponent = MockComponent<any>({
  selector: 'ol-map',
  inputs: ['center', 'zoom', 'rotation', 'projection', 'coordinateProjection'],
  outputs: ['viewChange', 'mapClick', 'mapDblClick'],
});
