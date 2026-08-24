import { describe, it, expect } from 'vitest';
import { render } from '@angular-helpers/testing';
import { OlLayerSwitcherComponent } from './layer-switcher.component';
import type { LayerSwitcherItem } from '../models/layer-switcher.types';

describe('OlLayerSwitcherComponent', () => {
  const sampleLayers: LayerSwitcherItem[] = [
    { id: 'osm', visible: true, opacity: 1, type: 'tile' },
    { id: 'buildings', visible: false, opacity: 0.8, type: 'vector' },
    { id: 'radar', visible: true, opacity: 0.5, type: 'image' },
  ];

  it('renders collapsed state by default and toggles expand when clicked', async () => {
    const result = await render(OlLayerSwitcherComponent, {
      inputs: {
        layers: sampleLayers,
        startCollapsed: true,
        collapsible: true,
      },
    });

    const switcherEl = result.query('.ol-layer-switcher');
    expect(switcherEl?.classList.contains('collapsed')).toBe(true);

    // Click toggle button to expand
    result.click('.ol-layer-switcher__toggle');
    expect(switcherEl?.classList.contains('collapsed')).toBe(false);

    // Click again to collapse
    result.click('.ol-layer-switcher__toggle');
    expect(switcherEl?.classList.contains('collapsed')).toBe(true);
  });

  it('does not toggle when collapsible is false', async () => {
    const result = await render(OlLayerSwitcherComponent, {
      inputs: {
        layers: sampleLayers,
        startCollapsed: false,
        collapsible: false,
      },
    });

    const switcherEl = result.query('.ol-layer-switcher');
    expect(switcherEl?.classList.contains('collapsed')).toBe(false);

    result.click('.ol-layer-switcher__toggle');
    expect(switcherEl?.classList.contains('collapsed')).toBe(false);
  });

  it('emits visibilityChange when layer checkbox is clicked', async () => {
    let emittedEvent: { id: string; visible: boolean } | null = null;

    const result = await render(OlLayerSwitcherComponent, {
      inputs: {
        layers: sampleLayers,
        startCollapsed: false,
      },
      outputs: {
        visibilityChange: (e) => (emittedEvent = e),
      },
    });

    // Check osm layer (visible: true -> should emit visible: false)
    result.component.toggleLayer('osm');
    expect(emittedEvent).toEqual({ id: 'osm', visible: false });

    // Check buildings layer (visible: false -> should emit visible: true)
    result.component.toggleLayer('buildings');
    expect(emittedEvent).toEqual({ id: 'buildings', visible: true });
  });

  it('emits opacityChange when opacity slider input changes', async () => {
    let emittedOpacity: { id: string; opacity: number } | null = null;

    const result = await render(OlLayerSwitcherComponent, {
      inputs: {
        layers: sampleLayers,
        startCollapsed: false,
        showOpacity: true,
      },
      outputs: {
        opacityChange: (e) => (emittedOpacity = e),
      },
    });

    const mockEvent = {
      target: { valueAsNumber: 0.3 },
    } as unknown as Event;

    result.component.setOpacity('osm', mockEvent);
    expect(emittedOpacity).toEqual({ id: 'osm', opacity: 0.3 });
  });

  it('displays empty state when layers array is empty', async () => {
    const result = await render(OlLayerSwitcherComponent, {
      inputs: {
        layers: [],
        startCollapsed: false,
      },
    });

    expect(result.query('.ol-layer-switcher__empty')).toBeTruthy();
  });

  it('applies position classes properly', async () => {
    const result = await render(OlLayerSwitcherComponent, {
      inputs: {
        position: 'bottom-left',
        layers: sampleLayers,
      },
    });

    expect(result.query('.ol-layer-switcher--bottom-left')).toBeTruthy();
  });
});
