// OlLayerSwitcherComponent tests with Analog

import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OlLayerSwitcherComponent } from './layer-switcher.component';
import type { LayerSwitcherItem } from '../models/layer-switcher.types';

describe('OlLayerSwitcherComponent', () => {
  let fixture: ComponentFixture<OlLayerSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlLayerSwitcherComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OlLayerSwitcherComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have default position as top-right', () => {
    const component = fixture.componentInstance;
    expect(component.position()).toBe('top-right');
  });

  it('should accept custom layers', () => {
    const component = fixture.componentInstance;
    const testLayers: LayerSwitcherItem[] = [
      { id: 'layer1', name: 'Layer 1', type: 'tile', visible: true, opacity: 1 },
      { id: 'layer2', name: 'Layer 2', type: 'vector', visible: false, opacity: 0.5 },
    ];

    fixture.componentRef.setInput('layers', testLayers);
    fixture.detectChanges();

    expect(component.layers()).toEqual(testLayers);
  });

  it('should emit visibilityChange when layer visibility is toggled', () => {
    const component = fixture.componentInstance;
    const testLayers: LayerSwitcherItem[] = [
      { id: 'layer1', name: 'Layer 1', type: 'tile', visible: true, opacity: 1 },
    ];

    fixture.componentRef.setInput('layers', testLayers);
    fixture.detectChanges();

    let emittedEvent: { id: string; visible: boolean } | undefined;
    component.visibilityChange.subscribe((event) => {
      emittedEvent = event;
    });

    component.toggleLayer('layer1');

    expect(emittedEvent).toEqual({ id: 'layer1', visible: false });
  });

  it('should emit opacityChange when layer opacity changes', () => {
    const component = fixture.componentInstance;
    const testLayers: LayerSwitcherItem[] = [
      { id: 'layer1', name: 'Layer 1', type: 'tile', visible: true, opacity: 1 },
    ];

    fixture.componentRef.setInput('layers', testLayers);
    fixture.detectChanges();

    let emittedEvent: { id: string; opacity: number } | undefined;
    component.opacityChange.subscribe((event) => {
      emittedEvent = event;
    });

    const mockEvent = { target: { valueAsNumber: 0.5 } } as unknown as Event;
    component.setOpacity('layer1', mockEvent);

    expect(emittedEvent).toEqual({ id: 'layer1', opacity: 0.5 });
  });
});
