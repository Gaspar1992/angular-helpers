// OlInteractionService unit tests
import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlInteractionService } from './interaction.service';
import { InteractionStateService } from './interaction-state.service';
import { SelectInteractionService } from './select-interaction.service';
import { DrawInteractionService } from './draw-interaction.service';
import { ModifyInteractionService } from './modify-interaction.service';
import type { ManagedInteraction } from './types';

const createMapServiceStub = () => {
  let onReadyCb: ((m: unknown) => void) | null = null;
  return {
    map: { id: 'fake-map' },
    getMap() {
      return this.map;
    },
    onReady(cb: (m: unknown) => void) {
      onReadyCb = cb;
      cb(this.map);
    },
    invokeReady(m: unknown) {
      onReadyCb?.(m);
    },
  };
};

const passthroughZone = {
  runOutsideAngular: <T>(f: () => T) => f(),
  runInsideAngular: <T>(f: () => T) => f(),
};

const buildService = () => {
  const mapService = createMapServiceStub();

  const stateService = new InteractionStateService();

  // Sub-services as spies that simulate adding the managed interaction to state
  const selectService = {
    createSelectInteraction: vi.fn((id: string, config: Record<string, unknown> = {}) => {
      const cleanup = vi.fn();
      const managed: ManagedInteraction = {
        id,
        type: 'select',
        olInteraction: {
          getFeatures: () => ({ clear: vi.fn() }),
        } as never,
        config: { active: true, ...config },
        cleanup,
      };
      stateService.addInteraction(managed);
    }),
  };
  const drawService = {
    createDrawInteraction: vi.fn((id: string, config: Record<string, unknown> = {}) => {
      const managed: ManagedInteraction = {
        id,
        type: 'draw',
        olInteraction: {} as never,
        config: { active: true, ...config },
        cleanup: vi.fn(),
      };
      stateService.addInteraction(managed);
      return true;
    }),
  };
  const modifyService = {
    createModifyInteraction: vi.fn((id: string, config: Record<string, unknown> = {}) => {
      const managed: ManagedInteraction = {
        id,
        type: 'modify',
        olInteraction: {} as never,
        config: { active: true, ...config },
        cleanup: vi.fn(),
      };
      stateService.addInteraction(managed);
    }),
  };

  const injector = Injector.create({
    providers: [
      { provide: OlMapService, useValue: mapService },
      { provide: OlZoneHelper, useValue: passthroughZone },
      { provide: InteractionStateService, useValue: stateService },
      { provide: SelectInteractionService, useValue: selectService },
      { provide: DrawInteractionService, useValue: drawService },
      { provide: ModifyInteractionService, useValue: modifyService },
    ],
  });

  const svc = runInInjectionContext(injector, () => new OlInteractionService());
  return { svc, mapService, stateService, selectService, drawService, modifyService };
};

describe('OlInteractionService', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('exposes signals and observables delegated to the state service', () => {
    expect(ctx.svc.selectionCount()).toBe(0);
    expect(ctx.svc.hasSelection()).toBe(false);
    expect(ctx.svc.activeInteractions()).toEqual([]);
    expect(ctx.svc.selectedFeatures()).toEqual([]);
    expect(ctx.svc.drawStart$).toBeDefined();
    expect(ctx.svc.drawEnd$).toBeDefined();
    expect(ctx.svc.modify$).toBeDefined();
  });

  it('enableSelect creates an interaction via SelectInteractionService and tracks it', () => {
    const handle = ctx.svc.enableSelect('s1', { multi: true });

    expect(ctx.selectService.createSelectInteraction).toHaveBeenCalledOnce();
    expect(ctx.svc.isActive('s1')).toBe(true);
    expect(typeof handle.cleanup).toBe('function');
  });

  it('enableSelect is idempotent for the same id', () => {
    ctx.svc.enableSelect('s1');
    ctx.svc.enableSelect('s1');

    expect(ctx.selectService.createSelectInteraction).toHaveBeenCalledOnce();
  });

  it('enableDraw delegates to DrawInteractionService and exposes isActive', () => {
    const handle = ctx.svc.enableDraw('d1', { type: 'Point' });

    expect(ctx.drawService.createDrawInteraction).toHaveBeenCalledOnce();
    expect(handle.isActive()).toBe(true);
    expect(ctx.svc.isActive('d1')).toBe(true);
  });

  it('enableDraw is idempotent for the same id and isActive() is false on re-call', () => {
    ctx.svc.enableDraw('d1', { type: 'Point' });
    const handle = ctx.svc.enableDraw('d1', { type: 'Point' });
    expect(handle.isActive()).toBe(false);
    expect(ctx.drawService.createDrawInteraction).toHaveBeenCalledOnce();
  });

  it('enableModify delegates to ModifyInteractionService and tracks state', () => {
    ctx.svc.enableModify('m1', {});
    expect(ctx.modifyService.createModifyInteraction).toHaveBeenCalledOnce();
    expect(ctx.svc.isActive('m1')).toBe(true);
  });

  it('enableModify is idempotent for the same id', () => {
    ctx.svc.enableModify('m1');
    ctx.svc.enableModify('m1');
    expect(ctx.modifyService.createModifyInteraction).toHaveBeenCalledOnce();
  });

  it('disableInteraction calls cleanup, removes from state, and clears selection if it was a select', () => {
    ctx.svc.enableSelect('s1');
    ctx.stateService.setSelectedFeatures([
      { id: '1', geometry: { type: 'Point', coordinates: [0, 0] } },
    ]);
    expect(ctx.svc.hasSelection()).toBe(true);

    const managed = ctx.stateService.findInteraction('s1');
    ctx.svc.disableInteraction('s1');

    expect(managed?.cleanup).toHaveBeenCalledOnce();
    expect(ctx.svc.isActive('s1')).toBe(false);
    expect(ctx.svc.hasSelection()).toBe(false);
  });

  it('disableInteraction does nothing when the id is unknown', () => {
    expect(() => ctx.svc.disableInteraction('missing')).not.toThrow();
  });

  it('disableInteraction does NOT clear selection when removing a non-select interaction', () => {
    ctx.svc.enableDraw('d1', { type: 'Point' });
    ctx.stateService.setSelectedFeatures([
      { id: '1', geometry: { type: 'Point', coordinates: [0, 0] } },
    ]);

    ctx.svc.disableInteraction('d1');
    expect(ctx.svc.hasSelection()).toBe(true);
  });

  it('disableAll removes every tracked interaction', () => {
    ctx.svc.enableSelect('s1');
    ctx.svc.enableDraw('d1', { type: 'Point' });
    ctx.svc.enableModify('m1');

    ctx.svc.disableAll();

    expect(ctx.svc.activeInteractions()).toEqual([]);
    expect(ctx.svc.getInteractionState()).toEqual([]);
  });

  it('clearSelection clears OL select features and the state', () => {
    ctx.svc.enableSelect('s1');
    const select = ctx.stateService.findInteraction('s1')!.olInteraction as unknown as {
      getFeatures: () => { clear: ReturnType<typeof vi.fn> };
    };
    const featuresClear = vi.fn();
    select.getFeatures = () => ({ clear: featuresClear });

    ctx.stateService.setSelectedFeatures([
      { id: '1', geometry: { type: 'Point', coordinates: [0, 0] } },
    ]);
    ctx.svc.clearSelection();

    expect(featuresClear).toHaveBeenCalledOnce();
    expect(ctx.svc.hasSelection()).toBe(false);
  });

  it('clearSelection tolerates select interactions whose olInteraction has no getFeatures', () => {
    ctx.svc.enableSelect('s1');
    const managed = ctx.stateService.findInteraction('s1')!;
    (managed.olInteraction as unknown as { getFeatures?: unknown }).getFeatures = undefined;

    ctx.stateService.setSelectedFeatures([
      { id: '1', geometry: { type: 'Point', coordinates: [0, 0] } },
    ]);
    expect(() => ctx.svc.clearSelection()).not.toThrow();
    expect(ctx.svc.hasSelection()).toBe(false);
  });

  it('getInteractionState mirrors stateService.getInteractionState', () => {
    ctx.svc.enableSelect('s1', { exclusive: false });
    ctx.svc.enableDraw('d1', { type: 'Point', exclusive: false });

    expect(ctx.svc.getInteractionState()).toEqual([
      { id: 's1', type: 'select', active: true },
      { id: 'd1', type: 'draw', active: true },
    ]);
  });
});
