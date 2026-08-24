import { describe, it, expect } from 'vitest';
import { render } from '@angular-helpers/testing';
import { OlBasemapSwitcherComponent } from './basemap-switcher.component';
import type { BasemapConfig } from '../models/basemap-switcher.types';

describe('OlBasemapSwitcherComponent', () => {
  const sampleBasemaps: BasemapConfig[] = [
    { id: 'osm', name: 'OpenStreetMap', type: 'osm' },
    { id: 'satellite', name: 'Satellite', type: 'xyz', url: 'https://satellite.example.com' },
    { id: 'radar', name: 'WMS Radar', type: 'wms', url: 'https://wms.example.com' },
    { id: 'custom', name: 'Custom Map', type: 'custom' as any, icon: '🎨' },
  ];

  it('renders default collapsed state and expands on toggle click', async () => {
    const result = await render(OlBasemapSwitcherComponent, {
      inputs: {
        basemaps: sampleBasemaps,
        activeBasemap: 'osm',
        position: 'bottom-left',
      },
    });

    expect(result.query('.ol-basemap-switcher__panel')).toBeNull();
    expect(result.component.getActiveBasemapName()).toBe('OpenStreetMap');

    // Toggle open
    result.click('.ol-basemap-switcher__toggle');
    expect(result.query('.ol-basemap-switcher__panel')).toBeTruthy();
  });

  it('switches basemap, emits basemapChange, and closes panel', async () => {
    let selectedBasemap: string | null = null;

    const result = await render(OlBasemapSwitcherComponent, {
      inputs: {
        basemaps: sampleBasemaps,
        activeBasemap: 'osm',
      },
      outputs: {
        basemapChange: (id) => (selectedBasemap = id),
      },
    });

    result.component.toggleExpanded();
    result.fixture.detectChanges();

    // Click satellite item
    result.component.switchBasemap(sampleBasemaps[1]);
    expect(selectedBasemap).toBe('satellite');

    result.fixture.detectChanges();
    expect(result.query('.ol-basemap-switcher__panel')).toBeNull();
  });

  it('returns default icons based on basemap type or custom icon', async () => {
    const result = await render(OlBasemapSwitcherComponent, {
      inputs: {
        basemaps: sampleBasemaps,
      },
    });

    expect(result.component.getDefaultIcon(sampleBasemaps[0])).toBe('🗺️');
    expect(result.component.getDefaultIcon(sampleBasemaps[1])).toBe('🛰️');
    expect(result.component.getDefaultIcon(sampleBasemaps[2])).toBe('📡');
    expect(result.component.getDefaultIcon(sampleBasemaps[3])).toBe('🗺️');
  });

  it('applies position classes correctly', async () => {
    const result = await render(OlBasemapSwitcherComponent, {
      inputs: {
        position: 'top-center',
      },
    });

    expect(result.query('.ol-basemap-switcher--top-center')).toBeTruthy();
  });
});
