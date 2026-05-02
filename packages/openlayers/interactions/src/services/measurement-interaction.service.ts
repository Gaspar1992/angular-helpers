import { inject, Injectable } from '@angular/core';
import type OLMap from 'ol/Map';
import Draw, { type DrawEvent } from 'ol/interaction/Draw';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Overlay from 'ol/Overlay';
import { LineString, Polygon, type Geometry } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import type { EventsKey } from 'ol/events';
import type Feature from 'ol/Feature';
import type BaseEvent from 'ol/events/Event';

@Injectable()
export class MeasurementInteractionService {
  private mapService = inject(OlMapService);
  private zoneHelper = inject(OlZoneHelper);

  private draw?: Draw;
  private source = new VectorSource();
  private vectorLayer?: VectorLayer<VectorSource>;
  private map?: OLMap;

  private sketch: Feature<Geometry> | null = null;
  private measureTooltipElement: HTMLElement | null = null;
  private measureTooltip: Overlay | null = null;
  private listener: EventsKey | null = null;
  private isMeasuring = false;

  startMeasuring(type: 'LineString' | 'Polygon'): void {
    if (this.isMeasuring) this.stopMeasuring();

    this.map = this.mapService.getMap() ?? undefined;
    if (!this.map) return;

    this.zoneHelper.runOutsideAngular(() => {
      this.vectorLayer = new VectorLayer({
        source: this.source,
        style: new Style({
          fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
          stroke: new Stroke({ color: '#ffcc33', width: 2 }),
          image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ffcc33' }) }),
        }),
        zIndex: 9999,
      });
      this.map!.addLayer(this.vectorLayer);

      this.draw = new Draw({
        source: this.source,
        type,
        style: new Style({
          fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
          stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.5)', lineDash: [10, 10], width: 2 }),
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)' }),
            fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
          }),
        }),
      });

      this.map!.addInteraction(this.draw);
      this.createMeasureTooltip();

      this.draw.on('drawstart', (evt: DrawEvent & { coordinate?: [number, number] }) => {
        this.sketch = evt.feature;
        let tooltipCoord = evt.coordinate;

        const geometry = this.sketch?.getGeometry();
        if (geometry) {
          this.listener = geometry.on('change', (e: BaseEvent) => {
            const geom = e.target;
            let output: string;
            if (geom instanceof Polygon) {
              output = this.formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates() as [number, number];
            } else if (geom instanceof LineString) {
              output = this.formatLength(geom);
              tooltipCoord = geom.getLastCoordinate() as [number, number];
            } else {
              output = '';
            }
            if (this.measureTooltipElement) {
              this.measureTooltipElement.innerHTML = output;
              this.measureTooltip?.setPosition(tooltipCoord);
            }
          });
        }
      });

      this.draw.on('drawend', () => {
        if (this.measureTooltipElement) {
          this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
          this.measureTooltip?.setOffset([0, -7]);
          this.sketch = null;
          this.measureTooltipElement = null;
          this.createMeasureTooltip();
        }
        if (this.listener) unByKey(this.listener);
      });

      this.isMeasuring = true;
    });
  }

  stopMeasuring(): void {
    if (!this.isMeasuring) return;
    this.zoneHelper.runOutsideAngular(() => {
      if (this.draw && this.map) this.map.removeInteraction(this.draw);
      if (this.vectorLayer && this.map) this.map.removeLayer(this.vectorLayer);
      this.source.clear();
      // Remove all tooltips
      const overlays = this.map
        ?.getOverlays()
        .getArray()
        .filter((o) => o.getElement()?.classList.contains('ol-tooltip'));
      overlays?.forEach((o) => this.map?.removeOverlay(o));
      this.isMeasuring = false;
      this.measureTooltipElement = null;
      this.measureTooltip = null;
    });
  }

  isActive(): boolean {
    return this.isMeasuring;
  }

  private createMeasureTooltip() {
    if (!this.map) return;
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode?.removeChild(this.measureTooltipElement);
    }
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    this.measureTooltipElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    this.measureTooltipElement.style.color = 'white';
    this.measureTooltipElement.style.padding = '4px 8px';
    this.measureTooltipElement.style.borderRadius = '4px';
    this.measureTooltipElement.style.fontSize = '12px';
    this.measureTooltipElement.style.whiteSpace = 'nowrap';
    this.measureTooltipElement.style.pointerEvents = 'none';

    this.measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
    });
    this.map.addOverlay(this.measureTooltip);
  }

  private formatLength(line: LineString): string {
    const length = getLength(line);
    let output;
    if (length > 100) {
      output = Math.round((length / 1000) * 100) / 100 + ' km';
    } else {
      output = Math.round(length * 100) / 100 + ' m';
    }
    return output;
  }

  private formatArea(polygon: Polygon): string {
    const area = getArea(polygon);
    let output;
    if (area > 10000) {
      output = Math.round((area / 1000000) * 100) / 100 + ' km<sup>2</sup>';
    } else {
      output = Math.round(area * 100) / 100 + ' m<sup>2</sup>';
    }
    return output;
  }
}
