// OlMapComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import OLMap from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import type { Coordinate, Pixel, ViewState } from '../../models/types';
import { OlMapService } from '../../services/map.service';

export interface MapClickEvent {
  coordinate: Coordinate;
  pixel: Pixel;
}

@Component({
  selector: 'ol-map',
  template: `<div class="ol-map-container" #mapContainer></div>
    <ng-content />`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
      }
      .ol-map-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlMapComponent implements OnDestroy {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone, { optional: true });

  center = input<Coordinate>([0, 0]);
  zoom = input<number>(0);
  rotation = input<number>(0);
  projection = input<string>('EPSG:3857');

  viewChange = output<ViewState>();
  mapClick = output<MapClickEvent>();
  mapDblClick = output<MapClickEvent>();

  mapContainerRef = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map?: OLMap;

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      const center = this.center();
      if (this.map) this.updateCenter(center);
    });
    effect(() => {
      const zoom = this.zoom();
      if (this.map) this.updateZoom(zoom);
    });
    effect(() => {
      const rotation = this.rotation();
      if (this.map) this.updateRotation(rotation);
    });
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private initMap(): void {
    const container = this.mapContainerRef().nativeElement;
    this.ngZone.runOutsideAngular(() => {
      const view = new View({
        center: fromLonLat(this.center(), this.projection()),
        zoom: this.zoom(),
        rotation: this.rotation(),
        projection: this.projection(),
      });
      this.map = new OLMap({ target: container, view, layers: [] });
      this.mapService.setMap(this.map);

      view.on('change:center', () => this.runInsideAngular(() => this.emitViewChange()));
      view.on('change:resolution', () => this.runInsideAngular(() => this.emitViewChange()));

      this.map.on('click', (e) =>
        this.runInsideAngular(() =>
          this.mapClick.emit({
            coordinate: e.coordinate as Coordinate,
            pixel: e.pixel as Pixel,
          }),
        ),
      );
      this.map.on('dblclick', (e) =>
        this.runInsideAngular(() =>
          this.mapDblClick.emit({
            coordinate: e.coordinate as Coordinate,
            pixel: e.pixel as Pixel,
          }),
        ),
      );
    });
    this.emitViewChange();
  }

  /**
   * Runs callback outside Angular zone if available (for performance with NgZone),
   * or directly if zoneless.
   */
  private runOutsideAngular<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.runOutsideAngular(fn);
    }
    return fn();
  }

  /**
   * Runs callback inside Angular zone if available (for triggering CD),
   * or directly if zoneless (signals handle reactivity).
   */
  private runInsideAngular<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.run(fn);
    }
    return fn();
  }

  private destroyMap(): void {
    if (this.map) {
      this.runOutsideAngular(() => {
        this.map!.setTarget(undefined);
        this.map!.dispose();
      });
      this.map = undefined;
      this.mapService.setMap(null as unknown as OLMap);
    }
  }

  private updateCenter(center: Coordinate): void {
    if (!this.map) return;
    const view = this.map.getView();
    const projectedCenter = fromLonLat(center, this.projection());
    const currentCenter = view.getCenter();
    // Only update if center is significantly different (prevents interfering with animations)
    if (
      !currentCenter ||
      Math.abs(currentCenter[0] - projectedCenter[0]) > 1 ||
      Math.abs(currentCenter[1] - projectedCenter[1]) > 1
    ) {
      this.runOutsideAngular(() => view.setCenter(projectedCenter));
    }
  }

  private updateZoom(zoom: number): void {
    if (!this.map) return;
    const view = this.map.getView();
    const currentZoom = view.getZoom();
    // Only update if zoom is different (prevents interfering with animations)
    if (currentZoom !== zoom) {
      this.runOutsideAngular(() => view.setZoom(zoom));
    }
  }

  private updateRotation(rotation: number): void {
    if (!this.map) return;
    const view = this.map.getView();
    const currentRotation = view.getRotation();
    // Only update if rotation is significantly different
    if (Math.abs(currentRotation - rotation) > 0.001) {
      this.runOutsideAngular(() => view.setRotation(rotation));
    }
  }

  private emitViewChange(): void {
    const view = this.map?.getView();
    if (view) {
      const projectedCenter = view.getCenter() ?? [0, 0];
      const lonLatCenter = toLonLat(projectedCenter, this.projection()) as Coordinate;
      this.viewChange.emit({
        center: lonLatCenter,
        zoom: view.getZoom() ?? 0,
        rotation: view.getRotation() ?? 0,
      });
    }
  }
}
