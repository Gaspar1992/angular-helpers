import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@angular-helpers/testing';
import { OlImageLayerComponent } from './image-layer.component';
import { OlLayerService } from '../services/layer.service';

describe('OlImageLayerComponent', () => {
  let layerServiceMock: any;

  beforeEach(() => {
    layerServiceMock = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };
  });

  it('adds image layer on render and removes on destroy', async () => {
    const { component, fixture } = await render(OlImageLayerComponent, {
      providers: [{ provide: OlLayerService, useValue: layerServiceMock }],
      inputs: {
        id: 'wms-img',
        sourceType: 'wms',
        url: 'https://wms.example.com',
        zIndex: 2,
        opacity: 0.75,
        visible: true,
      },
    });

    expect(component).toBeTruthy();
    expect(layerServiceMock.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'wms-img',
        type: 'image',
        zIndex: 2,
        opacity: 0.75,
        visible: true,
      }),
    );

    fixture.destroy();
    expect(layerServiceMock.removeLayer).toHaveBeenCalledWith('wms-img');
  });
});
