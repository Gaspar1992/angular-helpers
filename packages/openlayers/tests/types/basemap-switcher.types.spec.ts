// OlBasemapSwitcher types unit tests

import { describe, it, expect } from 'vitest';
import type { BasemapConfig } from '../models/basemap-switcher.types';

describe('BasemapConfig interface', () => {
  it('should have correct structure for OSM', () => {
    const config: BasemapConfig = {
      id: 'osm',
      name: 'OpenStreetMap',
      type: 'osm',
    };

    expect(config.id).toBe('osm');
    expect(config.name).toBe('OpenStreetMap');
    expect(config.type).toBe('osm');
  });

  it('should have correct structure for XYZ', () => {
    const config: BasemapConfig = {
      id: 'satellite',
      name: 'Satellite',
      type: 'xyz',
      url: 'https://example.com/{z}/{x}/{y}.png',
      attributions: '© Example',
    };

    expect(config.id).toBe('satellite');
    expect(config.type).toBe('xyz');
    expect(config.url).toBe('https://example.com/{z}/{x}/{y}.png');
    expect(config.attributions).toBe('© Example');
  });

  it('should support optional icon', () => {
    const config: BasemapConfig = {
      id: 'custom',
      name: 'Custom',
      type: 'wms',
      icon: '🗺️',
    };

    expect(config.icon).toBe('🗺️');
  });

  it('should accept WMS type', () => {
    const config: BasemapConfig = {
      id: 'wms-layer',
      name: 'WMS Layer',
      type: 'wms',
      url: 'https://example.com/wms',
      params: { layers: 'layer1' },
    };

    expect(config.type).toBe('wms');
    expect(config.params).toEqual({ layers: 'layer1' });
  });
});
