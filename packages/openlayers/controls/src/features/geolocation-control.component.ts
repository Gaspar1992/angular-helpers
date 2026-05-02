import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import Control from 'ol/control/Control';
import Geolocation from 'ol/Geolocation';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import type { ControlPosition } from '../models/control.types';

@Component({
  selector: 'ol-geolocation-control',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #controlElement
      class="ol-geolocation-control ol-unselectable ol-control"
      [ngClass]="position()"
    >
      <button
        type="button"
        [class.active]="tracking()"
        (click)="toggleTracking()"
        [attr.title]="tracking() ? 'Stop tracking' : 'Track location'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="geolocation-icon"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3" [attr.fill]="tracking() ? 'currentColor' : 'none'"></circle>
          <line x1="12" y1="2" x2="12" y2="4"></line>
          <line x1="12" y1="20" x2="12" y2="22"></line>
          <line x1="20" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="12" x2="4" y2="12"></line>
        </svg>
      </button>
    </div>
  `,
  styles: [
    `
      .ol-geolocation-control {
        position: absolute;
      }
      .ol-geolocation-control.top-left {
        top: 4.5em;
        left: 0.5em;
      }
      .ol-geolocation-control.top-right {
        top: 4.5em;
        right: 0.5em;
      }
      .ol-geolocation-control.bottom-left {
        bottom: 0.5em;
        left: 0.5em;
      }
      .ol-geolocation-control.bottom-right {
        bottom: 0.5em;
        right: 0.5em;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.375em;
        height: 1.375em;
        padding: 0;
        background-color: rgba(255, 255, 255, 0.4);
        border: none;
        cursor: pointer;
        border-radius: 2px;
        color: #333;
        transition: all 0.2s;
      }

      button:hover {
        background-color: rgba(255, 255, 255, 0.8);
      }

      button.active {
        color: #3b82f6;
        background-color: rgba(255, 255, 255, 0.9);
      }

      .geolocation-icon {
        width: 1em;
        height: 1em;
      }
    `,
  ],
})
export class OlGeolocationControlComponent {
  private mapService = inject(OlMapService);
  private zoneHelper = inject(OlZoneHelper);
  private destroyRef = inject(DestroyRef);

  position = input<ControlPosition>('top-right');
  trackingChange = output<boolean>();

  @ViewChild('controlElement') controlElement!: ElementRef<HTMLElement>;

  protected tracking = signal(false);

  private control?: Control;
  private geolocation?: Geolocation;
  private positionFeature?: Feature;
  private accuracyFeature?: Feature;
  private layer?: VectorLayer<VectorSource>;

  constructor() {
    afterNextRender(() => {
      const map = this.mapService.getMap();
      if (!map) return;

      this.zoneHelper.runOutsideAngular(() => {
        // Create the Control
        this.control = new Control({
          element: this.controlElement.nativeElement,
        });
        map.addControl(this.control);

        // Setup Geolocation
        const view = map.getView();
        this.geolocation = new Geolocation({
          trackingOptions: {
            enableHighAccuracy: true,
          },
          projection: view.getProjection(),
        });

        // Setup Features
        this.accuracyFeature = new Feature();
        this.positionFeature = new Feature();
        this.positionFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 6,
              fill: new Fill({
                color: '#3b82f6',
              }),
              stroke: new Stroke({
                color: '#fff',
                width: 2,
              }),
            }),
          }),
        );

        // Setup Vector Layer to show position
        const vectorSource = new VectorSource({
          features: [this.accuracyFeature, this.positionFeature],
        });

        this.layer = new VectorLayer({
          source: vectorSource,
          zIndex: 9999, // Always on top
        });
        map.addLayer(this.layer);

        // Listeners
        this.geolocation.on('change:accuracyGeometry', () => {
          this.accuracyFeature?.setGeometry(this.geolocation?.getAccuracyGeometry() ?? undefined);
        });

        this.geolocation.on('change:position', () => {
          const coordinates = this.geolocation?.getPosition();
          this.positionFeature?.setGeometry(coordinates ? new Point(coordinates) : undefined);

          if (coordinates && this.tracking()) {
            map.getView().animate({ center: coordinates, duration: 500 });
          }
        });
      });
    });

    this.destroyRef.onDestroy(() => {
      const map = this.mapService.getMap();
      if (map) {
        if (this.control) map.removeControl(this.control);
        if (this.layer) map.removeLayer(this.layer);
      }
      if (this.geolocation) {
        this.geolocation.setTracking(false);
      }
    });
  }

  toggleTracking(): void {
    const nextState = !this.tracking();
    this.tracking.set(nextState);
    this.trackingChange.emit(nextState);

    if (this.geolocation) {
      this.zoneHelper.runOutsideAngular(() => {
        this.geolocation!.setTracking(nextState);
        if (nextState) {
          const coordinates = this.geolocation!.getPosition();
          if (coordinates) {
            this.mapService
              .getMap()
              ?.getView()
              .animate({ center: coordinates, zoom: 15, duration: 500 });
          }
        } else {
          this.positionFeature?.setGeometry(undefined);
          this.accuracyFeature?.setGeometry(undefined);
        }
      });
    }
  }
}
