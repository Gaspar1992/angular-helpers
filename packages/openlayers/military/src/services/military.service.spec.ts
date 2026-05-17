import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Coordinate } from '../../../core/src/index';
import { OlMilitaryService } from './military.service';
import { OlGeometryService } from '../../../core/src/index';
import { TestBed } from '@angular/core/testing';

// ---------------------------------------------------------------------------
// Mock milsymbol so tests don't depend on the real library
// ---------------------------------------------------------------------------

vi.mock('milsymbol-esm', () => {
  const MockSymbol = class MockSymbol {
    sidc: string;
    options: Record<string, unknown>;
    constructor(sidc: string, options: Record<string, unknown> = {}) {
      this.sidc = sidc;
      this.options = options;
    }
    asSVG(): string {
      return `<svg data-sidc="${this.sidc}"/>`;
    }
    getSize(): { width: number; height: number } {
      return { width: 100, height: 80 };
    }
    getAnchor(): { x: number; y: number } {
      return { x: 50, y: 40 };
    }
    getColors(): unknown {
      return {};
    }
    getOctagonAnchor(): { x: number; y: number } {
      return { x: 50, y: 40 };
    }
  };
  return { ms: { Symbol: MockSymbol } };
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('OlMilitaryService', () => {
  let service: OlMilitaryService;
  const center: Coordinate = [-3.7, 40.42]; // Madrid

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OlMilitaryService, OlGeometryService],
    });
    service = TestBed.inject(OlMilitaryService);
  });

  // -------------------------------------------------------------------------
  // milsymbol integration
  // -------------------------------------------------------------------------

  describe('createMilSymbol', () => {
    it('produces a feature with icon style', async () => {
      const f = await service.createMilSymbol({ sidc: 'SFGPUCI-----', position: center });
      expect(f.style?.icon?.src).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(f.style?.icon?.size).toBeDefined();
      expect(f.style?.icon?.size?.length).toBe(2);
      expect(f.style?.icon?.anchor).toBeDefined();
      expect(f.properties?.['sidc']).toBe('SFGPUCI-----');
    });

    it('coerces a numeric quantity to a string for milsymbol', async () => {
      const f = await service.createMilSymbol({
        sidc: 'SFGPUCI-----',
        position: center,
        quantity: 12,
      });
      expect(f.properties?.['quantity']).toBe('12');
    });

    it('throws on invalid SIDC', async () => {
      await expect(service.createMilSymbol({ sidc: 'short', position: center })).rejects.toThrow(
        /SIDC/,
      );
    });
  });

  // -------------------------------------------------------------------------
  // SSR / non-browser
  // -------------------------------------------------------------------------
});
