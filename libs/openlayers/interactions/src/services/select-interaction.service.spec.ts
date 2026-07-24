import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Collection, Feature as OLFeature } from 'ol';
import Point from 'ol/geom/Point';
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
});
