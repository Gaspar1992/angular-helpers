import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { provideOpenLayers } from './providers';
import { withProjections } from './with-projections';
import { get as getProjection } from 'ol/proj';

import proj4 from 'proj4';

describe('withProjections', () => {
  it('registers custom projections and their extents using proj4', () => {
    // Set up test bed to trigger ENVIRONMENT_INITIALIZER
    TestBed.configureTestingModule({
      providers: [
        provideOpenLayers(
          withProjections(proj4, [
            {
              code: 'EPSG:25830',
              def: '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
              extent: [0, 0, 1000, 1000],
            },
          ]),
        ),
      ],
    });

    // Inject EnvironmentInjector to trigger ENVIRONMENT_INITIALIZER
    TestBed.inject(EnvironmentInjector);

    const proj = getProjection('EPSG:25830');
    expect(proj).toBeTruthy();
    expect(proj?.getExtent()).toEqual([0, 0, 1000, 1000]);
  });
});
