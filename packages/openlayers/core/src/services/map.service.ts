// OlMapService

import { Injectable, NgZone, inject } from '@angular/core';
import type OLMap from 'ol/Map';
import type { View } from 'ol';
import type { Coordinate as OLCoordinate } from 'ol/coordinate';
import type { Extent as OLExtent } from 'ol/extent';
import type { AnimationOptions as OLAnimationOptions, FitOptions as OLFitOptions } from 'ol/View';
import type { Coordinate, Extent } from '../models/types';

export interface AnimationOptions {
  center?: Coordinate;
  zoom?: number;
  rotation?: number;
  duration?: number;
}

export interface FitOptions {
  padding?: [number, number, number, number];
  maxZoom?: number;
  duration?: number;
}

export interface MapViewOptions {
  center?: Coordinate;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  rotation?: number;
  projection?: string;
}

@Injectable()
export class OlMapService {
  private ngZone = inject(NgZone);
  private map: OLMap | null = null;

  setMap(map: OLMap): void {
    this.map = map;
  }
  getMap(): OLMap | null {
    return this.map;
  }
  getView(): View | null {
    return this.map?.getView() ?? null;
  }

  setCenter(coordinate: Coordinate): void {
    const view = this.getView();
    if (view) this.ngZone.runOutsideAngular(() => view.setCenter(coordinate as OLCoordinate));
  }

  setZoom(level: number): void {
    const view = this.getView();
    if (view) this.ngZone.runOutsideAngular(() => view.setZoom(level));
  }

  fitExtent(extent: Extent, options?: FitOptions): void {
    const view = this.getView();
    if (view)
      this.ngZone.runOutsideAngular(() => view.fit(extent as OLExtent, options as OLFitOptions));
  }

  animateView(options: AnimationOptions): Promise<void> {
    const view = this.getView();
    if (!view) return Promise.resolve();
    return new Promise((resolve) => {
      this.ngZone.runOutsideAngular(() => {
        view.animate(
          {
            center: options.center as OLCoordinate,
            zoom: options.zoom,
            rotation: options.rotation,
            duration: options.duration ?? 250,
          } as OLAnimationOptions,
          () => this.ngZone.run(() => resolve()),
        );
      });
    });
  }

  getViewState(): { center: Coordinate; zoom: number; rotation: number } {
    const view = this.getView();
    if (!view) return { center: [0, 0], zoom: 0, rotation: 0 };
    return {
      center: (view.getCenter() ?? [0, 0]) as Coordinate,
      zoom: view.getZoom() ?? 0,
      rotation: view.getRotation() ?? 0,
    };
  }
}
