// OlMapService unit tests

import { describe, it, expect } from 'vitest';
import {
  OlMapService,
  type AnimationOptions,
  type FitOptions,
  type MapViewOptions,
} from './map.service';

describe('OlMapService interfaces', () => {
  it('should have correct AnimationOptions structure', () => {
    const options: AnimationOptions = {
      center: [2.17, 41.38],
      zoom: 12,
      rotation: 0,
      duration: 1000,
    };

    expect(options.center).toEqual([2.17, 41.38]);
    expect(options.zoom).toBe(12);
    expect(options.rotation).toBe(0);
    expect(options.duration).toBe(1000);
  });

  it('should have correct FitOptions structure', () => {
    const options: FitOptions = {
      padding: [10, 10, 10, 10],
      maxZoom: 18,
      duration: 500,
    };

    expect(options.padding).toEqual([10, 10, 10, 10]);
    expect(options.maxZoom).toBe(18);
    expect(options.duration).toBe(500);
  });

  it('should have correct MapViewOptions structure', () => {
    const options: MapViewOptions = {
      center: [2.17, 41.38],
      zoom: 12,
      minZoom: 0,
      maxZoom: 20,
      rotation: 0,
      projection: 'EPSG:3857',
    };

    expect(options.center).toEqual([2.17, 41.38]);
    expect(options.zoom).toBe(12);
    expect(options.minZoom).toBe(0);
    expect(options.maxZoom).toBe(20);
    expect(options.rotation).toBe(0);
    expect(options.projection).toBe('EPSG:3857');
  });
});

describe('OlMapService class', () => {
  it('should be defined', () => {
    expect(OlMapService).toBeDefined();
  });
});
