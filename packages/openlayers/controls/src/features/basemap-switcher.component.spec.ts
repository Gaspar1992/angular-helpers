// OlBasemapSwitcherComponent tests with Analog

import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OlBasemapSwitcherComponent } from './basemap-switcher.component';
import type { BasemapConfig } from '../models/basemap-switcher.types';

describe('OlBasemapSwitcherComponent', () => {
  let fixture: ComponentFixture<OlBasemapSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlBasemapSwitcherComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OlBasemapSwitcherComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have default position as bottom-left', () => {
    const component = fixture.componentInstance;
    expect(component.position()).toBe('bottom-left');
  });

  it('should accept custom basemaps', () => {
    const component = fixture.componentInstance;
    const testBasemaps: BasemapConfig[] = [
      { id: 'osm', name: 'OpenStreetMap', type: 'osm' },
      { id: 'satellite', name: 'Satellite', type: 'xyz', url: 'https://example.com' },
    ];

    fixture.componentRef.setInput('basemaps', testBasemaps);
    fixture.detectChanges();

    expect(component.basemaps()).toEqual(testBasemaps);
  });

  it('should emit basemapChange when basemap is switched', () => {
    const component = fixture.componentInstance;
    const testBasemaps: BasemapConfig[] = [
      { id: 'osm', name: 'OpenStreetMap', type: 'osm' },
      { id: 'satellite', name: 'Satellite', type: 'xyz', url: 'https://example.com' },
    ];

    fixture.componentRef.setInput('basemaps', testBasemaps);
    fixture.detectChanges();

    let emittedId: string | undefined;
    component.basemapChange.subscribe((id) => {
      emittedId = id;
    });

    component.switchBasemap(testBasemaps[1]);

    expect(emittedId).toBe('satellite');
  });

  it('should return correct active basemap name', () => {
    const component = fixture.componentInstance;
    const testBasemaps: BasemapConfig[] = [
      { id: 'osm', name: 'OpenStreetMap', type: 'osm' },
      { id: 'satellite', name: 'Satellite', type: 'xyz', url: 'https://example.com' },
    ];

    fixture.componentRef.setInput('basemaps', testBasemaps);
    fixture.componentRef.setInput('activeBasemap', 'satellite');
    fixture.detectChanges();

    expect(component.getActiveBasemapName()).toBe('Satellite');
  });

  it('should return default icon based on type', () => {
    const component = fixture.componentInstance;

    const osmConfig: BasemapConfig = { id: 'osm', name: 'OSM', type: 'osm' };
    const xyzConfig: BasemapConfig = { id: 'xyz', name: 'XYZ', type: 'xyz' };
    const wmsConfig: BasemapConfig = { id: 'wms', name: 'WMS', type: 'wms' };

    expect(component.getDefaultIcon(osmConfig)).toBe('🗺️');
    expect(component.getDefaultIcon(xyzConfig)).toBe('🛰️');
    expect(component.getDefaultIcon(wmsConfig)).toBe('📡');
  });
});
