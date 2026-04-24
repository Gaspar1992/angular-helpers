// OlMapComponent

import {
  AfterViewInit,
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
import { fromLonLat } from 'ol/proj';
import type { Coordinate, ViewState } from '../../models/types';
import { OlMapService } from '../../services/map.service';

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
export class OlMapComponent implements AfterViewInit, OnDestroy {
  private mapService = inject(OlMapService);
  private ngZone = inject(NgZone);

  center = input<Coordinate>([0, 0]);
  zoom = input<number>(0);
  rotation = input<number>(0);
  projection = input<string>('EPSG:3857');

  viewChange = output<ViewState>();

  mapContainerRef = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private map?: OLMap;

  constructor() {
    effect(() => {
      if (this.map) this.updateCenter(this.center());
    });
    effect(() => {
      if (this.map) this.updateZoom(this.zoom());
    });
    effect(() => {
      if (this.map) this.updateRotation(this.rotation());
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
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
      view.on('change:center', () => this.ngZone.run(() => this.emitViewChange()));
      view.on('change:resolution', () => this.ngZone.run(() => this.emitViewChange()));
    });
    this.emitViewChange();
  }

  private destroyMap(): void {
    if (this.map) {
      this.ngZone.runOutsideAngular(() => {
        this.map!.setTarget(undefined);
        this.map!.dispose();
      });
      this.map = undefined;
      this.mapService.setMap(null as unknown as OLMap);
    }
  }

  private updateCenter(center: Coordinate): void {
    if (this.map)
      this.ngZone.runOutsideAngular(() =>
        this.map!.getView().setCenter(fromLonLat(center, this.projection())),
      );
  }

  private updateZoom(zoom: number): void {
    if (this.map) this.ngZone.runOutsideAngular(() => this.map!.getView().setZoom(zoom));
  }

  private updateRotation(rotation: number): void {
    if (this.map) this.ngZone.runOutsideAngular(() => this.map!.getView().setRotation(rotation));
  }

  private emitViewChange(): void {
    const view = this.map?.getView();
    if (view)
      this.viewChange.emit({
        center: (view.getCenter() ?? [0, 0]) as Coordinate,
        zoom: view.getZoom() ?? 0,
        rotation: view.getRotation() ?? 0,
      });
  }
}
