import { describe, it, expect } from 'vitest';
import { render } from '@angular-helpers/testing';
import { OlClusterComponent } from './cluster.component';
import type { Feature } from '@angular-helpers/openlayers/core';

describe('OlClusterComponent', () => {
  it('initializes with default inputs', async () => {
    const { component } = await render(OlClusterComponent, {
      inputs: {
        distance: 40,
        minDistance: 20,
        showCount: true,
        spiderfyOnSelect: false,
      },
    });

    expect(component).toBeTruthy();
    expect(component.distance()).toBe(40);
    expect(component.minDistance()).toBe(20);
    expect(component.showCount()).toBe(true);
    expect(component.spiderfyOnSelect()).toBe(false);
  });

  it('allows custom inputs and spiderfyClick output binding', async () => {
    let clickedFeature: Feature | null = null;
    const { component, fixture } = await render(OlClusterComponent, {
      inputs: {
        distance: 60,
        minDistance: 30,
        showCount: false,
        spiderfyOnSelect: true,
      },
      outputs: {
        spiderfyClick: (f: Feature) => (clickedFeature = f),
      },
    });

    expect(component.distance()).toBe(60);
    expect(component.minDistance()).toBe(30);
    expect(component.showCount()).toBe(false);
    expect(component.spiderfyOnSelect()).toBe(true);

    const testFeature: Feature = {
      id: 'f1',
      geometry: { type: 'Point', coordinates: [0, 0] },
    };
    component.spiderfyClick.emit(testFeature);
    expect(clickedFeature).toEqual(testFeature);
  });
});
