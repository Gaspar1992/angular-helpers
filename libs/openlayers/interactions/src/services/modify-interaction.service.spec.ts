import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Feature as OLFeature, Collection } from 'ol';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { ModifyInteractionService } from './modify-interaction.service';
import { InteractionStateService } from './interaction-state.service';
import { OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '@angular-helpers/openlayers/layers';

describe('ModifyInteractionService', () => {
  let service: ModifyInteractionService;
  let stateService: InteractionStateService;
  let layerServiceMock: any;
  let zoneHelper: OlZoneHelper;
  let mapMock: any;
  let vectorSource: VectorSource;
  let vectorLayer: VectorLayer<VectorSource>;

  beforeEach(() => {
    stateService = new InteractionStateService();
    vectorSource = new VectorSource();
    vectorLayer = new VectorLayer({ source: vectorSource, properties: { id: 'edit-layer' } });

    layerServiceMock = {
      getLayer: vi.fn().mockImplementation((id: string) => {
        if (id === 'edit-layer') return vectorLayer;
        return undefined;
      }),
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
        ModifyInteractionService,
        { provide: InteractionStateService, useValue: stateService },
        { provide: OlLayerService, useValue: layerServiceMock },
        { provide: OlZoneHelper, useValue: zoneHelper },
      ],
    });

    service = runInInjectionContext(injector, () => injector.get(ModifyInteractionService));
  });

  it('creates Modify and Snap interactions when source layer exists', () => {
    service.createModifyInteraction(
      'modify-1',
      { source: 'edit-layer', snapTolerance: 15 },
      mapMock,
    );

    expect(mapMock.addInteraction).toHaveBeenCalledTimes(2); // Modify + Snap
    expect(stateService.findInteraction('modify-1')).toBeDefined();
  });

  it('returns early if target source layer is not found', () => {
    service.createModifyInteraction('modify-missing', { source: 'non-existent' }, mapMock);

    expect(mapMock.addInteraction).not.toHaveBeenCalled();
    expect(stateService.findInteraction('modify-missing')).toBeUndefined();
  });

  it('emits modifystart and modifyend events', () => {
    service.createModifyInteraction('modify-events', { source: 'edit-layer' }, mapMock);

    const modifyInteraction = mapMock.addInteraction.mock.calls[0][0];

    const modifyEvents: any[] = [];
    stateService.modify$.subscribe((e) => modifyEvents.push(e));

    const f1 = new OLFeature(new Point([10, 20]));
    f1.setId('feat-mod-1');

    const featureCollection = new Collection([f1]);

    // Dispatch modifystart
    modifyInteraction.dispatchEvent({
      type: 'modifystart',
      features: featureCollection,
    });

    expect(modifyEvents).toHaveLength(1);
    expect(modifyEvents[0].type).toBe('modifystart');
    expect(modifyEvents[0].interactionId).toBe('modify-events');
    expect(modifyEvents[0].features).toHaveLength(1);

    // Dispatch modifyend
    modifyInteraction.dispatchEvent({
      type: 'modifyend',
      features: featureCollection,
    });

    expect(modifyEvents).toHaveLength(2);
    expect(modifyEvents[1].type).toBe('modifyend');
  });

  it('cleans up and disposes modify and snap interactions on cleanup', () => {
    service.createModifyInteraction('modify-cleanup', { source: 'edit-layer' }, mapMock);

    const managed = stateService.findInteraction('modify-cleanup');
    expect(managed).toBeDefined();

    managed?.cleanup();
    expect(mapMock.removeInteraction).toHaveBeenCalledTimes(2);
  });
});
