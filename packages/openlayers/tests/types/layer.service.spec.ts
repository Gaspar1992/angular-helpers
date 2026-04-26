// OlLayerService unit tests

import { describe, it, expect } from 'vitest';
import type { LayerInfo } from './layer.service';

describe('LayerInfo interface', () => {
  it('should have correct LayerInfo structure', () => {
    const layerInfo: LayerInfo = {
      id: 'test-layer',
      type: 'tile',
      visible: true,
      opacity: 1,
      zIndex: 0,
    };

    expect(layerInfo.id).toBe('test-layer');
    expect(layerInfo.type).toBe('tile');
    expect(layerInfo.visible).toBe(true);
    expect(layerInfo.opacity).toBe(1);
    expect(layerInfo.zIndex).toBe(0);
  });

  it('should accept vector layer type', () => {
    const vectorLayer: LayerInfo = {
      id: 'vector',
      type: 'vector',
      visible: true,
      opacity: 1,
      zIndex: 0,
    };

    expect(vectorLayer.type).toBe('vector');
  });

  it('should accept tile layer type', () => {
    const tileLayer: LayerInfo = {
      id: 'tile',
      type: 'tile',
      visible: true,
      opacity: 1,
      zIndex: 0,
    };

    expect(tileLayer.type).toBe('tile');
  });

  it('should accept image layer type', () => {
    const imageLayer: LayerInfo = {
      id: 'image',
      type: 'image',
      visible: true,
      opacity: 1,
      zIndex: 0,
    };

    expect(imageLayer.type).toBe('image');
  });

  it('should handle layer with opacity less than 1', () => {
    const layer: LayerInfo = {
      id: 'semi-transparent',
      type: 'tile',
      visible: true,
      opacity: 0.5,
      zIndex: 0,
    };

    expect(layer.opacity).toBe(0.5);
  });

  it('should handle invisible layer', () => {
    const layer: LayerInfo = {
      id: 'hidden',
      type: 'vector',
      visible: false,
      opacity: 1,
      zIndex: 0,
    };

    expect(layer.visible).toBe(false);
  });

  it('should handle layer with custom zIndex', () => {
    const layer: LayerInfo = {
      id: 'on-top',
      type: 'tile',
      visible: true,
      opacity: 1,
      zIndex: 10,
    };

    expect(layer.zIndex).toBe(10);
  });
});
