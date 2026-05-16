import { ENVIRONMENT_INITIALIZER } from '@angular/core';
import { register } from 'ol/proj/proj4';
import { get as getProjection } from 'ol/proj';
import type { OlFeature } from './providers';

export interface Proj4Definition {
  code: string;
  def: string;
  extent?: [number, number, number, number];
}

/**
 * Registers custom projections using proj4.
 *
 * @param proj4 - The proj4 instance (must be passed to avoid strong dependency on proj4 package)
 * @param definitions - Array of projection definitions
 * @returns OlFeature for projections
 */
export function withProjections(
  proj4: any,
  definitions: Proj4Definition[],
): OlFeature<'projections'> {
  return {
    kind: 'projections',
    providers: [
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useValue: () => {
          definitions.forEach((d) => {
            proj4.defs(d.code, d.def);
          });
          register(proj4);

          definitions.forEach((d) => {
            if (d.extent) {
              const proj = getProjection(d.code);
              if (proj) {
                proj.setExtent(d.extent);
              }
            }
          });
        },
      },
    ],
  };
}
