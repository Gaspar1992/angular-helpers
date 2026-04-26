// LayerSwitcher types unit tests
import { describe, it, expect } from 'vitest';
import type { LayerSwitcherItem } from './layer-switcher.types';

describe('LayerSwitcherItem interface', () => {
  it('should have correct structure', () => {
    const item: LayerSwitcherItem = {
      id: 'test-layer',
      name: 'Test Layer',
      type: 'tile',
      visible: true,
      opacity: 1,
    };

    expect(item.id).toBe('test-layer');
    expect(item.name).toBe('Test Layer');
    expect(item.type).toBe('tile');
    expect(item.visible).toBe(true);
    expect(item.opacity).toBe(1);
  });

  it('should accept all layer types', () => {
    const vector: LayerSwitcherItem = {
      id: 'v',
      name: 'Vector',
      type: 'vector',
      visible: true,
      opacity: 1,
    };

    const tile: LayerSwitcherItem = {
      id: 't',
      name: 'Tile',
      type: 'tile',
      visible: true,
      opacity: 1,
    };

    const image: LayerSwitcherItem = {
      id: 'i',
      name: 'Image',
      type: 'image',
      visible: true,
      opacity: 1,
    };

    expect(vector.type).toBe('vector');
    expect(tile.type).toBe('tile');
    expect(image.type).toBe('image');
  });
});
