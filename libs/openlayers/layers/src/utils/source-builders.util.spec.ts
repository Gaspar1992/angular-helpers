import { describe, it, expect } from 'vitest';
import { buildTileSource, buildImageSource } from './source-builders.util';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import ImageStatic from 'ol/source/ImageStatic';
import ImageWMS from 'ol/source/ImageWMS';

describe('source-builders.util', () => {
  it('builds OSM tile source', () => {
    const source = buildTileSource({ type: 'osm', attributions: '© OpenStreetMap' });
    expect(source).toBeInstanceOf(OSM);
  });

  it('builds XYZ tile source', () => {
    const source = buildTileSource({
      type: 'xyz',
      url: 'https://tiles.example.com/{z}/{x}/{y}.png',
    });
    expect(source).toBeInstanceOf(XYZ);
  });

  it('builds TileWMS source', () => {
    const source = buildTileSource({
      type: 'wms',
      url: 'https://wms.example.com',
      params: { LAYERS: 'test_layer' },
    });
    expect(source).toBeInstanceOf(TileWMS);
  });

  it('falls back to OSM for unknown tile source type', () => {
    const source = buildTileSource({ type: 'unknown' as any });
    expect(source).toBeInstanceOf(OSM);
  });

  it('builds ImageStatic source', () => {
    const source = buildImageSource({
      type: 'static',
      url: 'https://example.com/overlay.png',
      imageExtent: [0, 0, 100, 100],
    });
    expect(source).toBeInstanceOf(ImageStatic);
  });

  it('builds ImageWMS source', () => {
    const source = buildImageSource({
      type: 'wms' as any,
      url: 'https://wms.example.com',
      params: { LAYERS: 'image_layer' },
    });
    expect(source).toBeInstanceOf(ImageWMS);
  });
});
