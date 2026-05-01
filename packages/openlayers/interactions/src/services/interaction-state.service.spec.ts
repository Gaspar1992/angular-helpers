// InteractionStateService unit tests
import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Feature } from '@angular-helpers/openlayers/core';
import { InteractionStateService } from './interaction-state.service';
import type { ManagedInteraction } from './types';

const makeFeature = (id: string, name = 'f'): Feature => ({
  id,
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { name },
});

const makeManaged = (id: string, type: ManagedInteraction['type'] = 'select'): ManagedInteraction =>
  ({
    id,
    type,
    olInteraction: {} as never,
    config: { active: true, exclusive: false },
    cleanup: vi.fn(),
  }) as ManagedInteraction;

describe('InteractionStateService', () => {
  let svc: InteractionStateService;

  beforeEach(() => {
    svc = new InteractionStateService();
  });

  it('starts with empty interactions and no selection', () => {
    expect(svc.getInteractions()).toEqual([]);
    expect(svc.selectedFeatures()).toEqual([]);
    expect(svc.selectionCount()).toBe(0);
    expect(svc.hasSelection()).toBe(false);
    expect(svc.activeInteractions()).toEqual([]);
  });

  it('addInteraction appends to the list', () => {
    svc.addInteraction(makeManaged('a'));
    svc.addInteraction(makeManaged('b', 'draw'));
    expect(svc.getInteractions()).toHaveLength(2);
    expect(svc.findInteraction('b')?.type).toBe('draw');
  });

  it('removeInteraction removes by id', () => {
    svc.addInteraction(makeManaged('a'));
    svc.addInteraction(makeManaged('b'));
    svc.removeInteraction('a');
    expect(svc.getInteractions().map((i) => i.id)).toEqual(['b']);
  });

  it('findInteraction returns undefined when not found', () => {
    expect(svc.findInteraction('missing')).toBeUndefined();
  });

  it('activeInteractions filters out inactive ones', () => {
    const a = makeManaged('a');
    const b = makeManaged('b', 'draw');
    b.config.active = false;
    svc.addInteraction(a);
    svc.addInteraction(b);
    expect(svc.activeInteractions().map((i) => i.id)).toEqual(['a']);
  });

  it('setSelectedFeatures and clearSelection update signals', () => {
    svc.setSelectedFeatures([makeFeature('1'), makeFeature('2')]);
    expect(svc.selectionCount()).toBe(2);
    expect(svc.hasSelection()).toBe(true);

    svc.clearSelection();
    expect(svc.selectionCount()).toBe(0);
    expect(svc.hasSelection()).toBe(false);
  });

  it('emits drawStart events to subscribers', () => {
    const handler = vi.fn();
    svc.drawStart$.subscribe(handler);
    const feature = makeFeature('1');
    svc.emitDrawStart({ feature });
    expect(handler).toHaveBeenCalledWith({ feature });
  });

  it('emits drawEnd events to subscribers', () => {
    const handler = vi.fn();
    svc.drawEnd$.subscribe(handler);
    svc.emitDrawEnd({ feature: makeFeature('1'), type: 'Point' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('emits modify events to subscribers', () => {
    const handler = vi.fn();
    svc.modify$.subscribe(handler);
    svc.emitModify({ features: [makeFeature('1')], type: 'modifyend' });
    expect(handler).toHaveBeenCalledWith({ features: expect.any(Array), type: 'modifyend' });
  });

  it('getInteractionState summarizes id, type and active flag', () => {
    const a = makeManaged('a', 'select');
    const b = makeManaged('b', 'draw');
    b.config.active = false;
    svc.addInteraction(a);
    svc.addInteraction(b);

    expect(svc.getInteractionState()).toEqual([
      { id: 'a', type: 'select', active: true },
      { id: 'b', type: 'draw', active: false },
    ]);
  });

  it('isActive returns false when interaction is missing', () => {
    expect(svc.isActive('nope')).toBe(false);
  });

  it('isActive reflects the active config of an existing interaction', () => {
    const a = makeManaged('a');
    svc.addInteraction(a);
    expect(svc.isActive('a')).toBe(true);

    const b = makeManaged('b');
    b.config.active = false;
    svc.addInteraction(b);
    expect(svc.isActive('b')).toBe(false);
  });

  it('clearAll wipes interactions and selection', () => {
    svc.addInteraction(makeManaged('a'));
    svc.setSelectedFeatures([makeFeature('1')]);
    svc.clearAll();
    expect(svc.getInteractions()).toEqual([]);
    expect(svc.selectedFeatures()).toEqual([]);
  });
});
