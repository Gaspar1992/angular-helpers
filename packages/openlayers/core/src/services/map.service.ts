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
  private ngZone = inject(NgZone, { optional: true });
  private map: OLMap | null = null;
  private readyCallbacks: Array<(map: OLMap) => void> = [];

  setMap(map: OLMap): void {
    this.map = map;
    const callbacks = this.readyCallbacks.splice(0);
    for (const cb of callbacks) {
      cb(map);
    }
  }

  getMap(): OLMap | null {
    return this.map;
  }

  onReady(callback: (map: OLMap) => void): void {
    if (this.map) {
      callback(this.map);
    } else {
      this.readyCallbacks.push(callback);
    }
  }
  getView(): View | null {
    return this.map?.getView() ?? null;
  }

  setCenter(coordinate: Coordinate): void {
    const view = this.getView();
    if (view) this.runOutsideAngular(() => view.setCenter(coordinate as OLCoordinate));
  }

  setZoom(level: number): void {
    const view = this.getView();
    if (view) this.runOutsideAngular(() => view.setZoom(level));
  }

  fitExtent(extent: Extent, options?: FitOptions): void {
    const map = this.map;
    const view = this.getView();
    if (!map || !view) return;

    // Defer to next macrotask to ensure DOM layout is complete
    setTimeout(() => {
      this.runOutsideAngular(() => {
        // Force size recalculation before fitting
        map.updateSize();
        view.fit(extent as OLExtent, options as OLFitOptions);
      });
    }, 0);
  }

  animateView(options: AnimationOptions): Promise<void> {
    const view = this.getView();
    if (!view) return Promise.resolve();
    return new Promise((resolve) => {
      this.runOutsideAngular(() => {
        view.animate(
          {
            center: options.center as OLCoordinate,
            zoom: options.zoom,
            rotation: options.rotation,
            duration: options.duration ?? 250,
          } as OLAnimationOptions,
          () => this.runInsideAngular(() => resolve()),
        );
      });
    });
  }

  /**
   * Runs callback outside Angular zone if available, or directly if zoneless.
   */
  private runOutsideAngular<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.runOutsideAngular(fn);
    }
    return fn();
  }

  /**
   * Runs callback inside Angular zone if available, or directly if zoneless.
   */
  private runInsideAngular<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.run(fn);
    }
    return fn();
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
