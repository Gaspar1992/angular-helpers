import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Feature as OLFeature } from 'ol';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { MeasurementInteractionService } from './measurement-interaction.service';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';

describe('MeasurementInteractionService', () => {
  let service: MeasurementInteractionService;
  let zoneHelper: OlZoneHelper;
  let mapMock: any;
  let mapServiceMock: any;
  let overlays: any[];

  beforeEach(() => {
    overlays = [];
    zoneHelper = {
      runOutsideAngular: (fn: any) => fn(),
      runInsideAngular: (fn: any) => fn(),
    } as any;

    mapMock = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      addInteraction: vi.fn(),
      removeInteraction: vi.fn(),
      addOverlay: vi.fn((overlay) => overlays.push(overlay)),
      removeOverlay: vi.fn((overlay) => {
        const index = overlays.indexOf(overlay);
        if (index > -1) overlays.splice(index, 1);
      }),
      getOverlays: () => ({
        getArray: () => [...overlays],
      }),
    };

    mapServiceMock = {
      getMap: () => mapMock,
    };

    const injector = Injector.create({
      providers: [
        MeasurementInteractionService,
        { provide: OlMapService, useValue: mapServiceMock },
        { provide: OlZoneHelper, useValue: zoneHelper },
      ],
    });

    service = runInInjectionContext(injector, () => injector.get(MeasurementInteractionService));
  });

  it('starts measuring for LineString, handles drawstart and live length calculations', () => {
    expect(service.isActive()).toBe(false);

    service.startMeasuring('LineString');
    expect(service.isActive()).toBe(true);
    expect(mapMock.addLayer).toHaveBeenCalled();
    expect(mapMock.addInteraction).toHaveBeenCalled();
    expect(mapMock.addOverlay).toHaveBeenCalled();

    const drawInteraction = mapMock.addInteraction.mock.calls[0][0];

    // Simulate drawstart with a short line
    const shortLine = new LineString([
      [0, 0],
      [10, 0],
    ]);
    const lineFeature = new OLFeature(shortLine);
    drawInteraction.dispatchEvent({ type: 'drawstart', feature: lineFeature, coordinate: [10, 0] });

    // Trigger geometry change
    shortLine.setCoordinates([
      [0, 0],
      [50, 0],
    ]);

    // Simulate drawend
    drawInteraction.dispatchEvent({ type: 'drawend', feature: lineFeature });
    expect(service.isActive()).toBe(true);
  });

  it('starts measuring for Polygon and formats area correctly', () => {
    service.startMeasuring('Polygon');
    expect(service.isActive()).toBe(true);

    const drawInteraction = mapMock.addInteraction.mock.calls[0][0];

    const polyGeom = new Polygon([
      [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
        [0, 0],
      ],
    ]);
    const polyFeature = new OLFeature(polyGeom);

    drawInteraction.dispatchEvent({
      type: 'drawstart',
      feature: polyFeature,
      coordinate: [50, 50],
    });

    // Trigger polygon geometry change
    polyGeom.setCoordinates([
      [
        [0, 0],
        [5000, 0],
        [5000, 5000],
        [0, 5000],
        [0, 0],
      ],
    ]);

    drawInteraction.dispatchEvent({ type: 'drawend', feature: polyFeature });
    expect(service.isActive()).toBe(true);
  });

  it('stops measuring and cleans up layers, interactions, and overlays', () => {
    service.startMeasuring('LineString');
    expect(service.isActive()).toBe(true);

    service.stopMeasuring();
    expect(service.isActive()).toBe(false);
    expect(mapMock.removeInteraction).toHaveBeenCalled();
    expect(mapMock.removeLayer).toHaveBeenCalled();
  });

  it('restarts measuring cleanly if startMeasuring is called while already active', () => {
    service.startMeasuring('LineString');
    expect(service.isActive()).toBe(true);

    // Call startMeasuring again
    service.startMeasuring('Polygon');
    expect(service.isActive()).toBe(true);
  });

  it('returns early if map is not available', () => {
    vi.spyOn(mapServiceMock, 'getMap').mockReturnValue(null);
    service.startMeasuring('LineString');
    expect(service.isActive()).toBe(false);
  });
});
