import { describe, it, expect, vi } from 'vitest';
import { Component, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OlMapComponent, OlMapService, provideOpenLayers } from '@angular-helpers/openlayers/core';

describe('openlayers hardening regressions', () => {
  it('isolates OlMapService per OlMapComponent instance on multi-map pages', () => {
    @Component({
      imports: [OlMapComponent],
      template: `
        <ol-map [center]="[0, 0]" [zoom]="2"></ol-map>
        <ol-map [center]="[10, 20]" [zoom]="4"></ol-map>
      `,
    })
    class MultiMapHostComponent {
      maps = viewChildren(OlMapComponent);
    }

    TestBed.configureTestingModule({
      imports: [MultiMapHostComponent],
      providers: [provideOpenLayers()],
    });

    const fixture = TestBed.createComponent(MultiMapHostComponent);
    fixture.detectChanges();

    const maps = fixture.componentInstance.maps();
    expect(maps).toHaveLength(2);
    expect((maps[0] as unknown as { mapService: OlMapService }).mapService).not.toBe(
      (maps[1] as unknown as { mapService: OlMapService }).mapService,
    );
  });

  it('applies degree tolerance for EPSG:4326 sub-degree center updates', () => {
    TestBed.configureTestingModule({
      imports: [OlMapComponent],
      providers: [provideOpenLayers()],
    });

    const fixture = TestBed.createComponent(OlMapComponent);
    fixture.componentRef.setInput('projection', 'EPSG:4326');
    fixture.componentRef.setInput('coordinateProjection', 'EPSG:4326');
    fixture.componentRef.setInput('center', [0, 0]);
    fixture.detectChanges();

    const comp = fixture.componentInstance as unknown as {
      map: {
        getView: () => { getCenter: () => number[]; setCenter: (c: number[]) => void };
        setTarget: () => void;
        dispose: () => void;
      };
      updateCenter: (c: [number, number]) => void;
    };
    const setCenter = vi.fn();
    comp.map = {
      getView: () => ({
        getCenter: () => [0, 0],
        setCenter,
      }),
      setTarget: vi.fn(),
      dispose: vi.fn(),
    };

    comp.updateCenter([0.05, 0.05]);
    expect(setCenter).toHaveBeenCalledWith([0.05, 0.05]);
  });

  it('returns an unsubscribe function from OlMapService.onReady and clears callbacks on setMap(null)', () => {
    TestBed.configureTestingModule({
      providers: [provideOpenLayers()],
    });
    const service = TestBed.inject(OlMapService);
    const cb = vi.fn();
    const unsub = service.onReady(cb);
    unsub();
    service.setMap(null);
    expect(cb).not.toHaveBeenCalled();
  });
});
