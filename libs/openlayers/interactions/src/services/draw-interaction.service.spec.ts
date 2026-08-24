import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Feature as OLFeature } from 'ol';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { DrawInteractionService } from './draw-interaction.service';
import { InteractionStateService } from './interaction-state.service';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '@angular-helpers/openlayers/layers';

describe('DrawInteractionService', () => {
  let service: DrawInteractionService;
  let stateService: InteractionStateService;
  let layerServiceMock: any;
  let zoneHelper: OlZoneHelper;
  let mapMock: any;

  beforeEach(() => {
    stateService = new InteractionStateService();
    layerServiceMock = {
      getLayer: vi.fn(),
    };
    zoneHelper = {
      runOutsideAngular: (fn: any) => fn(),
      runInsideAngular: (fn: any) => fn(),
    } as any;

    mapMock = {
      addInteraction: vi.fn(),
      removeInteraction: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        DrawInteractionService,
        { provide: InteractionStateService, useValue: stateService },
        { provide: OlLayerService, useValue: layerServiceMock },
        { provide: OlZoneHelper, useValue: zoneHelper },
        { provide: OlMapService, useValue: {} },
      ],
    });

    service = runInInjectionContext(injector, () => injector.get(DrawInteractionService));
  });

  it('creates Draw and Snap interactions on map with default temporary source', () => {
    const success = service.createDrawInteraction(
      'draw-1',
      { type: 'Point', freehand: true, snapTolerance: 15 },
      mapMock,
    );

    expect(success).toBe(true);
    expect(mapMock.addInteraction).toHaveBeenCalledTimes(2); // Draw + Snap
    expect(stateService.findInteraction('draw-1')).toBeDefined();
  });

  it('uses source from specified existing layer if provided', () => {
    const customSource = new VectorSource();
    const customLayer = new VectorLayer({ source: customSource });
    layerServiceMock.getLayer.mockReturnValue(customLayer);

    service.createDrawInteraction(
      'draw-layer-source',
      { type: 'Polygon', source: 'my-vector-layer' },
      mapMock,
    );

    expect(layerServiceMock.getLayer).toHaveBeenCalledWith('my-vector-layer');
    expect(stateService.findInteraction('draw-layer-source')).toBeDefined();
  });

  it('emits drawStart event on drawstart', () => {
    service.createDrawInteraction('draw-start-test', { type: 'LineString' }, mapMock);

    const drawInteraction = mapMock.addInteraction.mock.calls[0][0];

    const startEvents: any[] = [];
    stateService.drawStart$.subscribe((e) => startEvents.push(e));

    const testFeature = new OLFeature(new Point([10, 20]));
    drawInteraction.dispatchEvent({ type: 'drawstart', feature: testFeature });

    expect(startEvents).toHaveLength(1);
    expect(startEvents[0].interactionId).toBe('draw-start-test');
    expect(startEvents[0].feature).toBeDefined();
  });

  it('emits drawEnd event and sets default style and properties on drawend', () => {
    service.createDrawInteraction('draw-end-test', { type: 'Polygon' }, mapMock);

    const drawInteraction = mapMock.addInteraction.mock.calls[0][0];

    const endEvents: any[] = [];
    stateService.drawEnd$.subscribe((e) => endEvents.push(e));

    const testFeature = new OLFeature(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ]),
    );

    drawInteraction.dispatchEvent({ type: 'drawend', feature: testFeature });

    expect(endEvents).toHaveLength(1);
    expect(endEvents[0].interactionId).toBe('draw-end-test');
    expect(endEvents[0].type).toBe('Polygon');
    expect(endEvents[0].feature.properties?.name).toBe('Sketch');
    expect(endEvents[0].feature.properties?.strokeColor).toBe('#3b82f6');
  });

  it('supports special Ellipse geometry type with custom geometry function', () => {
    service.createDrawInteraction('ellipse-draw', { type: 'Ellipse' as any }, mapMock);

    const drawInteraction = mapMock.addInteraction.mock.calls[0][0];
    expect(drawInteraction).toBeDefined();
    const geomFn = (drawInteraction as any).geometryFunction_;
    if (geomFn) {
      const geom = geomFn(
        [
          [0, 0],
          [10, 0],
        ],
        null,
      );
      expect(geom).toBeDefined();
    }
  });

  it('supports special Donut geometry type with custom geometry function', () => {
    service.createDrawInteraction('donut-draw', { type: 'Donut' as any }, mapMock);

    const drawInteraction = mapMock.addInteraction.mock.calls[0][0];
    expect(drawInteraction).toBeDefined();
    const geomFn = (drawInteraction as any).geometryFunction_;
    if (geomFn) {
      const geom = geomFn(
        [
          [0, 0],
          [10, 0],
        ],
        null,
      );
      expect(geom).toBeDefined();
    }
  });

  it('cleans up and disposes draw and snap interactions when cleanup is invoked', () => {
    service.createDrawInteraction('cleanup-draw', { type: 'Point' }, mapMock);

    const interaction = stateService.findInteraction('cleanup-draw');
    expect(interaction).toBeDefined();

    interaction?.cleanup();
    expect(mapMock.removeInteraction).toHaveBeenCalledTimes(2); // Draw + Snap removed
  });
});
