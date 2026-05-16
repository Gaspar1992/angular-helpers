import { inject, Injectable, resource } from '@angular/core';
import type { Feature } from '@angular-helpers/openlayers/core';
import { OlGeometryService } from '@angular-helpers/openlayers/core';
import type { DonutConfig, EllipseConfig, SectorConfig } from '@angular-helpers/openlayers/core';
import type { MilSymbolConfig, MilSymbolStyleResult } from '../models/military.types';

/**
 * Service exposing geometry helpers and MIL-STD-2525 symbology rendering.
 *
 * - `createEllipse`, `createSector`, `createDonut` are **pure math** and
 *   delegate to {@link OlGeometryService} in core.
 * - `createMilSymbol` uses the milsymbol library via Angular resource loading.
 */
@Injectable()
export class OlMilitaryService {
  private idCounter = 0;
  private geometryService = inject(OlGeometryService);

  /**
   * Resource managing the lazy-loading of the milsymbol library.
   * Angular resource provides native signals for value, loading state, and errors.
   */
  private readonly msResource = resource({
    loader: () => import('milsymbol'),
  });

  /** Signal indicating if the milsymbol library is currently being loaded. */
  readonly isLoading = this.msResource.isLoading;

  constructor() {}

  // ---------------------------------------------------------------------------
  // Geometry helpers (delegated to core)
  // ---------------------------------------------------------------------------

  /**
   * Build a `Feature<Polygon>` approximating an ellipse centered at
   * `config.center`. See {@link EllipseConfig} for parameter semantics.
   */
  createEllipse(config: EllipseConfig): Feature {
    return this.geometryService.createEllipse(config);
  }

  /**
   * Build a `Feature<Polygon>` for a circular sector (pie slice).
   * See {@link SectorConfig} for parameter semantics.
   */
  createSector(config: SectorConfig): Feature {
    return this.geometryService.createSector(config);
  }

  /**
   * Build a `Feature<Polygon>` for a donut (annular ring).
   */
  createDonut(config: DonutConfig): Feature {
    return this.geometryService.createDonut(config);
  }

  // ---------------------------------------------------------------------------
  // MIL-STD-2525 symbology (lazy `milsymbol` load)
  // ---------------------------------------------------------------------------

  /**
   * Pre-load the optional `milsymbol` peer dependency.
   * Since resource() starts loading immediately, this simply returns a promise
   * that resolves when the resource is ready.
   */
  async preloadMilsymbol(): Promise<void> {
    this.assertBrowser();
    // We can just await the dynamic import again; the browser/bundler will
    // return the same module instantly if already loaded by the resource.
    await import('milsymbol');
  }

  /**
   * Build a MIL-STD-2525 symbol feature asynchronously.
   * Waits for the milsymbol resource to resolve.
   */
  async createMilSymbol(config: MilSymbolConfig): Promise<Feature> {
    this.assertBrowser();
    this.assertSidc(config.sidc);

    // Dynamic import ensures we have the module reference even if called
    // before the resource signal has propagated.
    const msModule = await import('milsymbol');
    return this.buildSymbolFeature(config, msModule);
  }

  /**
   * Build a MIL-STD-2525 symbol feature synchronously.
   * Throws if `milsymbol` resource is not ready.
   */
  createMilSymbolSync(config: MilSymbolConfig): Feature {
    this.assertBrowser();
    this.assertSidc(config.sidc);

    const msModule = this.msResource.value();
    if (!msModule) {
      throw new Error(
        'milsymbol is not loaded yet. Call preloadMilsymbol() or use the async createMilSymbol().',
      );
    }

    return this.buildSymbolFeature(config, msModule);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private nextId(kind: string): string {
    return `${kind}-${++this.idCounter}`;
  }

  private buildSymbolFeature(
    config: MilSymbolConfig,
    msModule: typeof import('milsymbol'),
  ): Feature {
    const { sidc, position, properties, quantity, ...rest } = config;
    const milOptions = {
      ...rest,
      ...(quantity !== undefined ? { quantity: String(quantity) } : {}),
    };

    const ms = msModule;
    const SymbolClass = (ms as any).default?.Symbol || ms.Symbol;
    const symbol = new SymbolClass(sidc, milOptions);
    const style = this.symbolToStyleResult(symbol);
    const mergedProperties: Record<string, unknown> = { sidc, ...milOptions, ...properties };

    return {
      id: this.nextId('symbol'),
      geometry: { type: 'Point', coordinates: position },
      properties: mergedProperties,
      style: { icon: { src: style.src, size: style.size, anchor: style.anchor } },
    };
  }

  private symbolToStyleResult(symbol: {
    asSVG(): string;
    getSize(): { width: number; height: number };
    getAnchor(): { x: number; y: number };
  }): MilSymbolStyleResult {
    const svg = symbol.asSVG();
    const { width, height } = symbol.getSize();
    const { x: ax, y: ay } = symbol.getAnchor();
    return {
      src: `data:image/svg+xml;base64,${this.encodeBase64Utf8(svg)}`,
      size: [width, height],
      anchor: [ax / width, ay / height],
    };
  }

  private encodeBase64Utf8(input: string): string {
    return btoa(unescape(encodeURIComponent(input)));
  }

  /**
   * Generates a canvas and anchor for a MIL-STD-2525 symbol.
   * Requires milsymbol to be loaded (synchronous).
   */
  createUnitStyle(
    sidc: string,
    selected = false,
    size = 30,
  ): {
    image: { img: HTMLCanvasElement; size: [number, number]; anchor: [number, number] };
    zIndex: number;
  } | null {
    const msModule = this.msResource.value();
    if (!msModule) return null;

    const ms = msModule;
    const SymbolClass = (ms as any).default?.Symbol || ms.Symbol;
    const symbol = new SymbolClass(sidc, {
      size,
      strokeWidth: selected ? 6 : 4,
    });

    const canvas = symbol.asCanvas();
    const anchor = (symbol as any).getAnchor();

    return {
      image: {
        img: canvas,
        size: [canvas.width, canvas.height],
        anchor: [anchor.x / canvas.width, anchor.y / canvas.height],
      },
      zIndex: selected ? 100 : 10,
    };
  }

  private assertSidc(sidc: unknown): asserts sidc is string {
    if (typeof sidc !== 'string' || sidc.length < 10) {
      throw new TypeError('sidc must be a non-empty MIL-STD-2525 SIDC string');
    }
  }

  private assertBrowser(): void {
    if (typeof window === 'undefined') {
      throw new Error('createMilSymbol requires a browser environment');
    }
  }
}
