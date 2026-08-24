import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Feature as OLFeature } from 'ol';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { SelectInteractionService } from './select-interaction.service';
import { InteractionStateService } from './interaction-state.service';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';

describe('SelectInteractionService', () => {
  let service: SelectInteractionService;
  let stateService: InteractionStateService;
  let zoneHelper: OlZoneHelper;
  let mapMock: any;

  beforeEach(() => {
    stateService = new InteractionStateService();
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
        SelectInteractionService,
        { provide: InteractionStateService, useValue: stateService },
        { provide: OlZoneHelper, useValue: zoneHelper },
        { provide: OlMapService, useValue: {} },
      ],
    });

    service = runInInjectionContext(injector, () => injector.get(SelectInteractionService));
  });

  it('tracks lastHoveredId and triggers emitHover only on feature ID change', () => {
    service.createSelectInteraction('s1', { condition: 'pointerMove' }, mapMock);

    expect(mapMock.addInteraction).toHaveBeenCalledOnce();
    const selectInteraction = mapMock.addInteraction.mock.calls[0][0];

    const hoverEvents: any[] = [];
    stateService.hover$.subscribe((e) => hoverEvents.push(e));

    const f1 = new OLFeature(new Point([0, 0]));
    f1.setId('feat-1');
    const f2 = new OLFeature(new Point([1, 1]));
    f2.setId('feat-2');

    // Simulate hovering over f1
    selectInteraction.getFeatures().push(f1);
    selectInteraction.dispatchEvent({ type: 'select', selected: [f1], deselected: [] });

    expect(hoverEvents).toHaveLength(1);
    expect(hoverEvents[0]).toEqual({
      interactionId: 's1',
      hoveredId: 'feat-1',
      feature: expect.objectContaining({ id: 'feat-1' }),
    });
    expect(stateService.hoveredFeature()?.id).toBe('feat-1');

    // Simulate hovering over f1 again (should NOT emit again because ID hasn't changed)
    selectInteraction.dispatchEvent({ type: 'select', selected: [f1], deselected: [] });
    expect(hoverEvents).toHaveLength(1);

    // Simulate hovering over f2
    selectInteraction.getFeatures().clear();
    selectInteraction.getFeatures().push(f2);
    selectInteraction.dispatchEvent({ type: 'select', selected: [f2], deselected: [f1] });

    expect(hoverEvents).toHaveLength(2);
    expect(hoverEvents[1].hoveredId).toBe('feat-2');
    expect(stateService.hoveredFeature()?.id).toBe('feat-2');

    // Simulate hovering out (no feature)
    selectInteraction.getFeatures().clear();
    selectInteraction.dispatchEvent({ type: 'select', selected: [], deselected: [f2] });

    expect(hoverEvents).toHaveLength(3);
    expect(hoverEvents[2].hoveredId).toBeNull();
    expect(stateService.hoveredFeature()).toBeNull();
  });

  it('handles click selection mode and emits select events with multiple features', () => {
    service.createSelectInteraction(
      'click-select',
      { condition: 'click', multi: true, hitTolerance: 5 },
      mapMock,
    );

    const selectInteraction = mapMock.addInteraction.mock.calls[0][0];

    const selectEvents: any[] = [];
    stateService.select$.subscribe((e) => selectEvents.push(e));

    const f1 = new OLFeature(new Point([10, 20]));
    f1.setId('f1');
    const f2 = new OLFeature(new Point([30, 40]));
    f2.setId('f2');

    selectInteraction.getFeatures().push(f1);
    selectInteraction.getFeatures().push(f2);
    selectInteraction.dispatchEvent({ type: 'select', selected: [f1, f2], deselected: [] });

    expect(selectEvents).toHaveLength(1);
    expect(selectEvents[0].selected).toHaveLength(2);
    expect(stateService.selectedFeatures()).toHaveLength(2);

    // Deselect f1
    selectInteraction.getFeatures().clear();
    selectInteraction.getFeatures().push(f2);
    selectInteraction.dispatchEvent({ type: 'select', selected: [], deselected: [f1] });

    expect(selectEvents).toHaveLength(2);
    expect(selectEvents[1].deselected).toHaveLength(1);
    expect(stateService.selectedFeatures()).toHaveLength(1);
  });

  it('applies layer filter correctly when layers config is specified', () => {
    service.createSelectInteraction(
      'layer-filtered',
      { layers: ['allowed-layer-1', 'allowed-layer-2'] },
      mapMock,
    );

    const selectInteraction = mapMock.addInteraction.mock.calls[0][0];
    const layerFilter = (selectInteraction as any).layerFilter_;

    const layer1 = new VectorLayer({
      source: new VectorSource(),
      properties: { id: 'allowed-layer-1' },
    });
    const layer3 = new VectorLayer({
      source: new VectorSource(),
      properties: { id: 'other-layer' },
    });

    expect(layerFilter(layer1)).toBe(true);
    expect(layerFilter(layer3)).toBe(false);
  });

  it('renders custom feature style and selection outline for Points, Polygons, and LineStrings', () => {
    service.createSelectInteraction('style-test', {}, mapMock);

    const selectInteraction = mapMock.addInteraction.mock.calls[0][0];
    const styleFn = selectInteraction.getStyle();

    // 1. Point feature with custom abstract style (icon, fill, stroke)
    const pointFeat = new OLFeature(new Point([0, 0]));
    pointFeat.set('__angular_helpers_style__', {
      icon: { src: 'https://example.com/icon.png', size: [32, 32], anchor: [0.5, 1] },
      fill: { color: 'rgba(255, 0, 0, 0.5)' },
      stroke: { color: '#ff0000', width: 3 },
    });

    const pointStyles = (styleFn as any)(pointFeat, 1);
    expect(pointStyles).toBeInstanceOf(Array);
    expect(pointStyles.length).toBe(2); // Base style + selection ring

    // 2. Polygon feature with default style (no custom abstract style)
    const polygonFeat = new OLFeature(
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

    const polygonStyles = (styleFn as any)(polygonFeat, 1);
    expect(polygonStyles).toBeInstanceOf(Array);
    expect(polygonStyles.length).toBe(2);

    // 3. LineString feature
    const lineFeat = new OLFeature(
      new LineString([
        [0, 0],
        [10, 10],
      ]),
    );
    const lineStyles = (styleFn as any)(lineFeat, 1);
    expect(lineStyles).toBeInstanceOf(Array);
  });

  it('cleans up and disposes interaction when managed cleanup is called', () => {
    service.createSelectInteraction('cleanup-test', {}, mapMock);

    const interaction = stateService.findInteraction('cleanup-test');
    expect(interaction).toBeDefined();

    interaction?.cleanup();
    expect(mapMock.removeInteraction).toHaveBeenCalled();
  });
});
