// Vitest setup for @angular-helpers/openlayers using Analog

import '@angular/compiler';
import '@analogjs/vitest-angular/setup-testbed';

// Mock OpenLayers for unit tests
global.HTMLElement.prototype.getBoundingClientRect = () => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 800,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});
