import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@angular-helpers/testing';
import { OlHeatmapLayerComponent } from './heatmap-layer.component';
import { OlLayerService } from '../services/layer.service';
import { OlMapService } from '@angular-helpers/openlayers/core';
import type { Feature } from '@angular-helpers/openlayers/core';

describe('OlHeatmapLayerComponent', () => {
  let layerServiceMock: any;
  let mapServiceMock: any;

  beforeEach(() => {
    layerServiceMock = {
      addLayer: vi.fn(),
      getLayer: vi.fn().mockReturnValue({}),
      updateFeatures: vi.fn(),
      setOpacity: vi.fn(),
      setVisibility: vi.fn(),
      setZIndex: vi.fn(),
      setHeatmapProperties: vi.fn(),
      removeLayer: vi.fn(),
    };

    mapServiceMock = {
      resolution: vi.fn().mockReturnValue(2),
    };
  });

  it('initializes heatmap layer with pixel-based blur and radius', async () => {
    const { component } = await render(OlHeatmapLayerComponent, {
      providers: [
        { provide: OlLayerService, useValue: layerServiceMock },
        { provide: OlMapService, useValue: mapServiceMock },
      ],
      inputs: {
        id: 'heat-layer-1',
        features: [],
        blur: 15,
        radius: 8,
        radiusUnit: 'pixels',
        zIndex: 3,
        opacity: 0.8,
        visible: true,
      },
    });

    expect(component).toBeTruthy();
    expect(layerServiceMock.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'heat-layer-1',
        type: 'heatmap',
        blur: 15,
        radius: 8,
        zIndex: 3,
        opacity: 0.8,
      }),
    );
  });

  it('computes meter-based scaled blur and radius using map resolution', async () => {
    await render(OlHeatmapLayerComponent, {
      providers: [
        { provide: OlLayerService, useValue: layerServiceMock },
        { provide: OlMapService, useValue: mapServiceMock },
      ],
      inputs: {
        id: 'heat-meter',
        radius: 20,
        blur: 10,
        radiusUnit: 'meters',
      },
    });

    // With resolution = 2, radius 20/2 = 10, blur 10/2 = 5
    expect(layerServiceMock.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'heat-meter',
        radius: 10,
        blur: 5,
      }),
    );
  });

  it('reacts to feature updates and property changes, cleans up on destroy', async () => {
    const { fixture } = await render(OlHeatmapLayerComponent, {
      providers: [
        { provide: OlLayerService, useValue: layerServiceMock },
        { provide: OlMapService, useValue: mapServiceMock },
      ],
      inputs: {
        id: 'heat-dyn',
        features: [],
        blur: 15,
        radius: 8,
      },
    });

    const newFeatures: Feature[] = [{ id: 'f1', geometry: { type: 'Point', coordinates: [1, 2] } }];
    fixture.componentRef.setInput('features', newFeatures);
    fixture.detectChanges();
    expect(layerServiceMock.updateFeatures).toHaveBeenCalledWith('heat-dyn', newFeatures);

    fixture.componentRef.setInput('opacity', 0.6);
    fixture.detectChanges();
    expect(layerServiceMock.setOpacity).toHaveBeenCalledWith('heat-dyn', 0.6);

    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    expect(layerServiceMock.setVisibility).toHaveBeenCalledWith('heat-dyn', false);

    fixture.destroy();
    expect(layerServiceMock.removeLayer).toHaveBeenCalledWith('heat-dyn');
  });
});
