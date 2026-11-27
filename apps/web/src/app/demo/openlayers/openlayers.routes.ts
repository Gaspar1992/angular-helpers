import { withControls } from '@angular-helpers/openlayers/controls';
import { provideOpenLayers } from '@angular-helpers/openlayers/core';
import { withLayers } from '@angular-helpers/openlayers/layers';
import type { Routes } from '@angular/router';
import { OpenLayersDemoComponent } from './openlayers-demo.component';

export const OPENLAYERS_DEMO_ROUTES: Routes = [
  {
    path: '',
    component: OpenLayersDemoComponent,
    providers: [provideOpenLayers(withLayers(), withControls())],
  },
];
