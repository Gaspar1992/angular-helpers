// OlBasemapSwitcherComponent - Switch between base map providers

import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { BasemapConfig } from '../models/basemap-switcher.types';

/**
 * A basemap switcher control that allows switching between
 * different tile providers without page refresh.
 *
 * @usageNotes
 * ```html
 * <ol-basemap-switcher
 *   position="bottom-left"
 *   [basemaps]="[
 *     { id: 'osm', name: 'OpenStreetMap', type: 'osm' },
 *     { id: 'satellite', name: 'Satellite', type: 'xyz', url: 'https://...' }
 *   ]"
 *   [activeBasemap]="'osm'"
 *   (basemapChange)="onBasemapChange($event)">
 * </ol-basemap-switcher>
 * ```
 */
@Component({
  selector: 'ol-basemap-switcher',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ol-basemap-switcher"
      [class.ol-basemap-switcher--top-left]="position() === 'top-left'"
      [class.ol-basemap-switcher--top-right]="position() === 'top-right'"
      [class.ol-basemap-switcher--bottom-left]="position() === 'bottom-left'"
      [class.ol-basemap-switcher--bottom-right]="position() === 'bottom-right'"
    >
      @if (isExpanded()) {
        <div class="ol-basemap-switcher__panel">
          @for (basemap of basemaps(); track basemap.id) {
            <button
              type="button"
              class="ol-basemap-switcher__item"
              [class.ol-basemap-switcher__item--active]="activeBasemap() === basemap.id"
              (click)="switchBasemap(basemap)"
            >
              <span class="ol-basemap-switcher__icon">{{
                basemap.icon || getDefaultIcon(basemap)
              }}</span>
              <span class="ol-basemap-switcher__name">{{ basemap.name }}</span>
            </button>
          }
        </div>
      }

      <button
        type="button"
        class="ol-basemap-switcher__toggle"
        (click)="toggleExpanded()"
        [attr.aria-expanded]="isExpanded()"
        aria-label="Toggle basemap switcher"
      >
        <span class="ol-basemap-switcher__toggle-icon">🗺️</span>
        <span class="ol-basemap-switcher__toggle-text">
          {{ getActiveBasemapName() }}
        </span>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .ol-basemap-switcher {
        position: absolute;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 1000;
      }

      .ol-basemap-switcher--top-left {
        top: 0.5em;
        left: 0.5em;
      }

      .ol-basemap-switcher--top-right {
        top: 0.5em;
        right: 0.5em;
      }

      .ol-basemap-switcher--bottom-left {
        bottom: 0.5em;
        left: 0.5em;
      }

      .ol-basemap-switcher--bottom-right {
        bottom: 0.5em;
        right: 0.5em;
      }

      .ol-basemap-switcher__toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: white;
        border: none;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        font-size: 14px;
      }

      .ol-basemap-switcher__toggle:hover {
        background: #f5f5f5;
      }

      .ol-basemap-switcher__toggle-icon {
        font-size: 16px;
      }

      .ol-basemap-switcher__toggle-text {
        font-weight: 500;
      }

      .ol-basemap-switcher__panel {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 0;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 4px;
        min-width: 160px;
      }

      .ol-basemap-switcher--bottom-right .ol-basemap-switcher__panel,
      .ol-basemap-switcher--top-right .ol-basemap-switcher__panel {
        left: auto;
        right: 0;
      }

      .ol-basemap-switcher--top-left .ol-basemap-switcher__panel,
      .ol-basemap-switcher--top-right .ol-basemap-switcher__panel {
        bottom: auto;
        top: calc(100% + 8px);
      }

      .ol-basemap-switcher__item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s ease;
      }

      .ol-basemap-switcher__item:hover {
        background: #f5f5f5;
      }

      .ol-basemap-switcher__item--active {
        background: #e3f2fd;
        color: #1976d2;
      }

      .ol-basemap-switcher__item--active:hover {
        background: #bbdefb;
      }

      .ol-basemap-switcher__icon {
        font-size: 16px;
      }

      .ol-basemap-switcher__name {
        font-weight: 500;
      }
    `,
  ],
})
export class OlBasemapSwitcherComponent {
  basemaps = input<BasemapConfig[]>([{ id: 'osm', name: 'OpenStreetMap', type: 'osm' }]);
  activeBasemap = input<string>('osm');
  position = input<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-left');

  basemapChange = output<string>();

  protected isExpanded = signal(false);

  toggleExpanded(): void {
    this.isExpanded.update((v: boolean) => !v);
  }

  switchBasemap(basemap: BasemapConfig): void {
    this.basemapChange.emit(basemap.id);
    this.isExpanded.set(false);
  }

  getActiveBasemapName(): string {
    const active = this.basemaps().find((b) => b.id === this.activeBasemap());
    return active?.name || 'Basemap';
  }

  getDefaultIcon(basemap: BasemapConfig): string {
    switch (basemap.type) {
      case 'osm':
        return '🗺️';
      case 'xyz':
        return '🛰️';
      case 'wms':
        return '📡';
      default:
        return '🗺️';
    }
  }
}
