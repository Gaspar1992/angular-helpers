// OlMapService

import { Injectable, inject, signal, Signal } from '@angular/core';
import type OLMap from 'ol/Map';
import type { View } from 'ol';
import type { Coordinate as OLCoordinate } from 'ol/coordinate';
import type { Extent as OLExtent } from 'ol/extent';
import type { AnimationOptions as OLAnimationOptions, FitOptions as OLFitOptions } from 'ol/View';
import type { Coordinate, Extent } from '../models/types';
import { OlZoneHelper } from './zone-helper.service';
import type { AnimationOptions, FitOptions } from '../models/map.types';
export { type AnimationOptions, type FitOptions, type MapViewOptions } from '../models/map.types';

@Injectable()
export class OlMapService {
  private zoneHelper = inject(OlZoneHelper);
  private map: OLMap | null = null;
  private readyCallbacks: Array<(map: OLMap) => void> = [];

  private _center = signal<Coordinate>([0, 0]);
  private _zoom = signal<number>(0);
  private _rotation = signal<number>(0);
  private _resolution = signal<number>(1);

  readonly center: Signal<Coordinate> = this._center.asReadonly();
  readonly zoom: Signal<number> = this._zoom.asReadonly();
  readonly rotation: Signal<number> = this._rotation.asReadonly();
  /** Signal that emits the current map resolution in meters per pixel */
  readonly resolution: Signal<number> = this._resolution.asReadonly();

  setMap(map: OLMap | null): void {
    this.map = map;
    if (map) {
      const view = map.getView();
      if (view) {
        this._center.set((view.getCenter() ?? [0, 0]) as Coordinate);
        this._zoom.set(view.getZoom() ?? 0);
        this._rotation.set(view.getRotation() ?? 0);
        this._resolution.set(view.getResolution() ?? 1);
      } else {
        this._resolution.set(1);
      }
      const callbacks = this.readyCallbacks.splice(0);
      for (const cb of callbacks) {
        cb(map);
      }
    }
  }

  setResolution(resolution: number): void {
    this._resolution.set(resolution);
  }

  updateViewState(center: Coordinate, zoom: number, rotation: number): void {
    this._center.set(center);
    this._zoom.set(zoom);
    this._rotation.set(rotation);
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
    if (view) this.zoneHelper.runOutsideAngular(() => view.setCenter(coordinate as OLCoordinate));
  }

  setZoom(level: number): void {
    const view = this.getView();
    if (view) this.zoneHelper.runOutsideAngular(() => view.setZoom(level));
  }

  fitExtent(extent: Extent, options?: FitOptions): void {
    const map = this.map;
    const view = this.getView();
    if (!map || !view) return;

    // Defer to next macrotask to ensure DOM layout is complete
    setTimeout(() => {
      this.zoneHelper.runOutsideAngular(() => {
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
      this.zoneHelper.runOutsideAngular(() => {
        view.animate(
          {
            center: options.center as OLCoordinate,
            zoom: options.zoom,
            rotation: options.rotation,
            duration: options.duration ?? 250,
          } as OLAnimationOptions,
          () => this.zoneHelper.runInsideAngular(() => resolve()),
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
