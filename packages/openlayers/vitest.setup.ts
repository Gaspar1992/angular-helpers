// Vitest setup for @angular-helpers/openlayers using Analog

import '@angular/compiler';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// Initialize Angular's TestBed once per test environment.
// Required by specs that use `TestBed.configureTestingModule` and by `createComponent`,
// which depends on framework providers registered through `BrowserTestingModule`.
setupTestBed();

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
