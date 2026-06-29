// OlMapComponent

import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import OLMap from 'ol/Map';
import View from 'ol/View';
import { transform } from 'ol/proj';
import type { Coordinate, Pixel, ViewState } from '../models/types';
import { OlMapService } from '../services/map.service';
import { OlZoneHelper } from '../services/zone-helper.service';

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
})
export class OlMapComponent {
  private mapService = inject(OlMapService);
  private zoneHelper = inject(OlZoneHelper);
  private destroyRef = inject(DestroyRef);

  center = input<Coordinate>([0, 0]);
  zoom = input<number>(0);
  rotation = input<number>(0);
  projection = input<string>('EPSG:3857');
  coordinateProjection = input<string>('EPSG:4326'); // Dynamic input for coordinate systems

  viewChange = output<ViewState>();
  mapClick = output<MapClickEvent>();
  mapDblClick = output<MapClickEvent>();

  mapContainerRef = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map?: OLMap;
  private resizeObserver?: ResizeObserver;

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

    // Cleanup when component is destroyed
    this.destroyRef.onDestroy(() => this.destroyMap());
  }

  private getProjectedCoordinate(coord: number[] | Coordinate): Coordinate {
    const coordProj = this.coordinateProjection();
    const mapProj = this.projection();
    if (coordProj === mapProj) return coord as Coordinate;
    return transform(coord, coordProj, mapProj) as Coordinate;
  }

  private getExternalCoordinate(coord: number[] | Coordinate): Coordinate {
    const coordProj = this.coordinateProjection();
    const mapProj = this.projection();
    if (coordProj === mapProj) return coord as Coordinate;
    return transform(coord, mapProj, coordProj) as Coordinate;
  }

  private initMap(): void {
    const container = this.mapContainerRef().nativeElement;
    this.zoneHelper.runOutsideAngular(() => {
      const view = new View({
        center: this.getProjectedCoordinate(this.center()),
        zoom: this.zoom(),
        rotation: this.rotation(),
        projection: this.projection(),
      });
      this.map = new OLMap({ target: container, view, layers: [] });
      this.mapService.setMap(this.map);

      // Add ResizeObserver to handle container size changes (e.g. sidebars, window resize)
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.map) {
            // Using requestAnimationFrame prevents "ResizeObserver loop limit exceeded" errors
            requestAnimationFrame(() => {
              if (this.map) this.map.updateSize();
            });
          }
        });
        this.resizeObserver.observe(container);
      }

      view.on('change:center', () => {
        if (this.viewChange.observed) {
          this.zoneHelper.runInsideAngular(() => this.emitViewChange());
        }
      });
      view.on('change:resolution', () => {
        this.mapService.setResolution(view.getResolution() ?? 1);
        if (this.viewChange.observed) {
          this.zoneHelper.runInsideAngular(() => this.emitViewChange());
        }
      });

      this.map.on('click', (e) => {
        if (this.mapClick.observed) {
          this.zoneHelper.runInsideAngular(() =>
            this.mapClick.emit({
              coordinate: this.getExternalCoordinate(e.coordinate) as Coordinate,
              pixel: e.pixel as Pixel,
            }),
          );
        }
      });
      this.map.on('dblclick', (e) => {
        if (this.mapDblClick.observed) {
          this.zoneHelper.runInsideAngular(() =>
            this.mapDblClick.emit({
              coordinate: this.getExternalCoordinate(e.coordinate) as Coordinate,
              pixel: e.pixel as Pixel,
            }),
          );
        }
      });
    });
    this.emitViewChange();
  }

  private destroyMap(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    if (this.map) {
      this.zoneHelper.runOutsideAngular(() => {
        this.map!.setTarget(undefined);
        this.map!.dispose();
      });
      this.map = undefined;
      this.mapService.setMap(null);
    }
  }

  private updateCenter(center: Coordinate): void {
    if (!this.map) return;
    const view = this.map.getView();
    const projectedCenter = this.getProjectedCoordinate(center);
    const currentCenter = view.getCenter();
    // Only update if center is significantly different (prevents interfering with animations)
    if (
      !currentCenter ||
      Math.abs(currentCenter[0] - projectedCenter[0]) > 1 ||
      Math.abs(currentCenter[1] - projectedCenter[1]) > 1
    ) {
      this.zoneHelper.runOutsideAngular(() => view.setCenter(projectedCenter));
    }
  }

  private updateZoom(zoom: number): void {
    if (!this.map) return;
    const view = this.map.getView();
    const currentZoom = view.getZoom();
    // Only update if zoom is different (prevents interfering with animations)
    if (currentZoom !== zoom) {
      this.zoneHelper.runOutsideAngular(() => view.setZoom(zoom));
    }
  }

  private updateRotation(rotation: number): void {
    if (!this.map) return;
    const view = this.map.getView();
    const currentRotation = view.getRotation();
    // Only update if rotation is significantly different
    if (Math.abs(currentRotation - rotation) > 0.001) {
      this.zoneHelper.runOutsideAngular(() => view.setRotation(rotation));
    }
  }

  private emitViewChange(): void {
    const view = this.map?.getView();
    if (view) {
      const projectedCenter = view.getCenter() ?? [0, 0];
      const externalCenter = this.getExternalCoordinate(projectedCenter) as Coordinate;
      this.viewChange.emit({
        center: externalCenter,
        zoom: view.getZoom() ?? 0,
        rotation: view.getRotation() ?? 0,
      });
    }
  }
}
