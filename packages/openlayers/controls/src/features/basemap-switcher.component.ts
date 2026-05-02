// OlBasemapSwitcherComponent - Switch between base map providers

import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { BasemapConfig, BasemapSwitcherPosition } from '../models/basemap-switcher.types';

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
      [class.ol-basemap-switcher--top-center]="position() === 'top-center'"
      [class.ol-basemap-switcher--top-right]="position() === 'top-right'"
      [class.ol-basemap-switcher--bottom-left]="position() === 'bottom-left'"
      [class.ol-basemap-switcher--bottom-center]="position() === 'bottom-center'"
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
        <span class="ol-basemap-switcher__toggle-icon"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path
              d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            ></path></svg
        ></span>
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
        font-size: 13px;
        color: #333;
        z-index: 100;
      }

      .ol-basemap-switcher--top-left {
        top: 0.5em;
        left: 0.5em;
      }

      .ol-basemap-switcher--top-center {
        top: 0.5em;
        left: 50%;
        transform: translateX(-50%);
      }

      .ol-basemap-switcher--top-right {
        top: 0.5em;
        right: 0.5em;
      }

      .ol-basemap-switcher--bottom-left {
        bottom: 0.5em;
        left: 0.5em;
      }

      .ol-basemap-switcher--bottom-center {
        bottom: 0.5em;
        left: 50%;
        transform: translateX(-50%);
      }

      .ol-basemap-switcher--bottom-right {
        bottom: 0.5em;
        right: 0.5em;
      }

      .ol-basemap-switcher__toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        border: none;
        border-radius: 4px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: background 0.15s ease;
        min-height: 36px;
      }

      .ol-basemap-switcher__toggle:hover {
        background: rgba(255, 255, 255, 1);
      }

      .ol-basemap-switcher__toggle-icon {
        font-size: 14px;
        line-height: 1;
      }

      .ol-basemap-switcher__toggle-text {
        font-weight: 600;
        font-size: 12px;
      }

      .ol-basemap-switcher__panel {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 0;
        background: rgba(255, 255, 255, 0.95);
        border: none;
        color: #333;
        border-radius: 4px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        padding: 4px;
        min-width: 160px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .ol-basemap-switcher--bottom-right .ol-basemap-switcher__panel,
      .ol-basemap-switcher--top-right .ol-basemap-switcher__panel {
        left: auto;
        right: 0;
      }

      .ol-basemap-switcher--top-left .ol-basemap-switcher__panel,
      .ol-basemap-switcher--top-center .ol-basemap-switcher__panel,
      .ol-basemap-switcher--top-right .ol-basemap-switcher__panel {
        bottom: auto;
        top: calc(100% + 6px);
      }

      .ol-basemap-switcher--top-center .ol-basemap-switcher__panel,
      .ol-basemap-switcher--bottom-center .ol-basemap-switcher__panel {
        left: 50%;
        transform: translateX(-50%);
      }

      .ol-basemap-switcher__item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 6px 10px;
        border: none;
        background: transparent;
        border-radius: 3px;
        cursor: pointer;
        text-align: left;
        font-size: 12px;
        transition: background 0.15s ease;
      }

      .ol-basemap-switcher__item:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .ol-basemap-switcher__item--active {
        background: rgba(26, 115, 232, 0.12);
        color: #1a73e8;
        font-weight: 600;
      }

      .ol-basemap-switcher__item--active:hover {
        background: rgba(26, 115, 232, 0.18);
      }

      .ol-basemap-switcher__icon {
        font-size: 14px;
      }

      .ol-basemap-switcher__name {
        font-weight: 500;
        color: #333;
        font-size: 12px;
      }
    `,
  ],
})
export class OlBasemapSwitcherComponent {
  basemaps = input<BasemapConfig[]>([{ id: 'osm', name: 'OpenStreetMap', type: 'osm' }]);
  activeBasemap = input<string>('osm');
  position = input<BasemapSwitcherPosition>('bottom-left');

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
