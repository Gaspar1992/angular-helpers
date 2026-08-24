import { describe, it, expect } from 'vitest';
import { render } from '@angular-helpers/testing';
import { OlMapComponent, type MapClickEvent } from './map.component';
import { OlMapService } from '../services/map.service';
import { OlZoneHelper } from '../services/zone-helper.service';
import type { ViewState } from '../models/types';

describe('OlMapComponent', () => {
  it('should initialize map, view, and set map in mapService on render', async () => {
    const { component, fixture } = await render(OlMapComponent, {
      providers: [OlMapService, OlZoneHelper],
      inputs: {
        center: [0, 0],
        zoom: 4,
        rotation: 0,
        projection: 'EPSG:3857',
        coordinateProjection: 'EPSG:4326',
      },
    });

    expect(component).toBeTruthy();
    const mapService = fixture.debugElement.injector.get(OlMapService);
    const map = mapService.getMap();
    expect(map).toBeDefined();
    expect(map?.getView().getZoom()).toBe(4);
  });

  it('should react to input changes for center, zoom, and rotation', async () => {
    const { fixture } = await render(OlMapComponent, {
      providers: [OlMapService, OlZoneHelper],
      inputs: {
        center: [0, 0],
        zoom: 2,
        rotation: 0,
        projection: 'EPSG:3857',
        coordinateProjection: 'EPSG:4326',
      },
    });

    const mapService = fixture.debugElement.injector.get(OlMapService);
    const map = mapService.getMap()!;
    const view = map.getView();

    // Update zoom
    fixture.componentRef.setInput('zoom', 6);
    fixture.detectChanges();
    expect(view.getZoom()).toBe(6);

    // Update rotation
    fixture.componentRef.setInput('rotation', Math.PI / 4);
    fixture.detectChanges();
    expect(view.getRotation()).toBeCloseTo(Math.PI / 4, 4);

    // Update center
    fixture.componentRef.setInput('center', [10, 20]);
    fixture.detectChanges();
    const center = view.getCenter()!;
    expect(center).toBeDefined();
  });

  it('should emit mapClick and mapDblClick events when clicked', async () => {
    let clickEvent: MapClickEvent | null = null;
    let dblClickEvent: MapClickEvent | null = null;

    const { fixture } = await render(OlMapComponent, {
      providers: [OlMapService, OlZoneHelper],
      inputs: {
        center: [0, 0],
        zoom: 2,
        projection: 'EPSG:3857',
        coordinateProjection: 'EPSG:4326',
      },
      outputs: {
        mapClick: (e: MapClickEvent) => (clickEvent = e),
        mapDblClick: (e: MapClickEvent) => (dblClickEvent = e),
      },
    });

    const mapService = fixture.debugElement.injector.get(OlMapService);
    const map = mapService.getMap()!;

    // Simulate click event on map
    map.dispatchEvent({
      type: 'click',
      coordinate: [0, 0],
      pixel: [100, 100],
    } as any);

    expect(clickEvent).toBeDefined();
    expect(clickEvent!.pixel).toEqual([100, 100]);

    // Simulate dblclick event on map
    map.dispatchEvent({
      type: 'dblclick',
      coordinate: [0, 0],
      pixel: [200, 200],
    } as any);

    expect(dblClickEvent).toBeDefined();
    expect(dblClickEvent!.pixel).toEqual([200, 200]);
  });

  it('should emit viewChange when center or resolution changes', async () => {
    const viewChanges: ViewState[] = [];

    const { fixture } = await render(OlMapComponent, {
      providers: [OlMapService, OlZoneHelper],
      inputs: {
        center: [0, 0],
        zoom: 2,
        projection: 'EPSG:3857',
        coordinateProjection: 'EPSG:4326',
      },
      outputs: {
        viewChange: (e: ViewState) => viewChanges.push(e),
      },
    });

    const mapService = fixture.debugElement.injector.get(OlMapService);
    const map = mapService.getMap()!;
    const view = map.getView();

    // Trigger center change
    view.setCenter([1000, 1000]);
    expect(viewChanges.length).toBeGreaterThan(0);

    // Trigger resolution change
    view.setResolution(100);
    expect(mapService.resolution()).toBe(100);
  });

  it('should clean up map and observers on destroy', async () => {
    const { fixture } = await render(OlMapComponent, {
      providers: [OlMapService, OlZoneHelper],
      inputs: {
        center: [0, 0],
        zoom: 2,
      },
    });

    const mapService = fixture.debugElement.injector.get(OlMapService);
    expect(mapService.getMap()).toBeDefined();

    fixture.destroy();
    expect(mapService.getMap()).toBeNull();
  });
});
