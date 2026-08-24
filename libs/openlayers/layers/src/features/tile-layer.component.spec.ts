import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@angular-helpers/testing';
import { OlTileLayerComponent } from './tile-layer.component';
import { OlLayerService } from '../services/layer.service';

describe('OlTileLayerComponent', () => {
  let layerServiceMock: any;

  beforeEach(() => {
    layerServiceMock = {
      addLayer: vi.fn(),
      setOpacity: vi.fn(),
      setVisibility: vi.fn(),
      setZIndex: vi.fn(),
      removeLayer: vi.fn(),
    };
  });

  it('initializes tile layer and registers with layerService', async () => {
    const { component } = await render(OlTileLayerComponent, {
      providers: [{ provide: OlLayerService, useValue: layerServiceMock }],
      inputs: {
        id: 'osm-layer',
        source: 'osm',
        zIndex: 1,
        opacity: 0.9,
        visible: true,
      },
    });

    expect(component).toBeTruthy();
    expect(layerServiceMock.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'osm-layer',
        type: 'tile',
        zIndex: 1,
        opacity: 0.9,
        visible: true,
      }),
    );
  });

  it('updates opacity, visibility, and zIndex via effects and cleans up on destroy', async () => {
    const { fixture } = await render(OlTileLayerComponent, {
      providers: [{ provide: OlLayerService, useValue: layerServiceMock }],
      inputs: {
        id: 'tile-dyn',
        source: 'xyz',
        url: 'https://tiles.example.com/{z}/{x}/{y}.png',
        zIndex: 0,
        opacity: 1,
        visible: true,
      },
    });

    fixture.componentRef.setInput('opacity', 0.5);
    fixture.detectChanges();
    expect(layerServiceMock.setOpacity).toHaveBeenCalledWith('tile-dyn', 0.5);

    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    expect(layerServiceMock.setVisibility).toHaveBeenCalledWith('tile-dyn', false);

    fixture.componentRef.setInput('zIndex', 4);
    fixture.detectChanges();
    expect(layerServiceMock.setZIndex).toHaveBeenCalledWith('tile-dyn', 4);

    fixture.destroy();
    expect(layerServiceMock.removeLayer).toHaveBeenCalledWith('tile-dyn');
  });
});
