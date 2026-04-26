// OlLayerSwitcherComponent - UI control for managing layer visibility

import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OlLayerService } from '../../../layers/src/services/layer.service';

/**
 * A reusable layer switcher control that displays all layers
 * and allows toggling their visibility.
 *
 * @usageNotes
 * ```html
 * <ol-layer-switcher
 *   position="top-right"
 *   collapsible="true"
 *   [showOpacity]="true">
 * </ol-layer-switcher>
 * ```
 */
@Component({
  selector: 'ol-layer-switcher',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ol-layer-switcher"
      [class.collapsed]="isCollapsed()"
      [class.ol-layer-switcher--top-left]="position() === 'top-left'"
      [class.ol-layer-switcher--top-right]="position() === 'top-right'"
      [class.ol-layer-switcher--bottom-left]="position() === 'bottom-left'"
      [class.ol-layer-switcher--bottom-right]="position() === 'bottom-right'"
    >
      <button
        type="button"
        class="ol-layer-switcher__toggle"
        (click)="toggleCollapsed()"
        [attr.aria-expanded]="!isCollapsed()"
        aria-label="Toggle layer switcher"
      >
        <span class="ol-layer-switcher__icon">🗺️</span>
        <span class="ol-layer-switcher__title">Layers</span>
      </button>

      @if (!isCollapsed()) {
        <div class="ol-layer-switcher__panel">
          @if (layerService.layers(); as layers) {
            @if (layers.length === 0) {
              <div class="ol-layer-switcher__empty">No layers</div>
            } @else {
              <ul class="ol-layer-switcher__list">
                @for (layer of layers; track layer.id) {
                  <li class="ol-layer-switcher__item">
                    <label class="ol-layer-switcher__label">
                      <input
                        type="checkbox"
                        [checked]="layer.visible"
                        (change)="toggleLayer(layer.id)"
                        class="ol-layer-switcher__checkbox"
                      />
                      <span class="ol-layer-switcher__name">{{ layer.id }}</span>
                      <span
                        class="ol-layer-switcher__type"
                        [class.ol-layer-switcher__type--vector]="layer.type === 'vector'"
                        [class.ol-layer-switcher__type--tile]="layer.type === 'tile'"
                        [class.ol-layer-switcher__type--image]="layer.type === 'image'"
                      >
                        {{ layer.type }}
                      </span>
                    </label>

                    @if (showOpacity()) {
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        [value]="layer.opacity"
                        (input)="setOpacity(layer.id, $event)"
                        class="ol-layer-switcher__opacity"
                        aria-label="Layer opacity"
                      />
                    }
                  </li>
                }
              </ul>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .ol-layer-switcher {
        position: absolute;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        min-width: 200px;
        z-index: 1000;
      }

      .ol-layer-switcher--top-left {
        top: 0.5em;
        left: 0.5em;
      }

      .ol-layer-switcher--top-right {
        top: 0.5em;
        right: 0.5em;
      }

      .ol-layer-switcher--bottom-left {
        bottom: 0.5em;
        left: 0.5em;
      }

      .ol-layer-switcher--bottom-right {
        bottom: 0.5em;
        right: 0.5em;
      }

      .ol-layer-switcher.collapsed {
        min-width: auto;
      }

      .ol-layer-switcher__toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        font-size: 14px;
      }

      .ol-layer-switcher__toggle:hover {
        background: #e0e0e0;
      }

      .ol-layer-switcher__icon {
        font-size: 16px;
      }

      .ol-layer-switcher__title {
        font-weight: 500;
      }

      .ol-layer-switcher.collapsed .ol-layer-switcher__title,
      .ol-layer-switcher.collapsed .ol-layer-switcher__panel {
        display: none;
      }

      .ol-layer-switcher__panel {
        padding: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .ol-layer-switcher__empty {
        padding: 16px;
        color: #666;
        text-align: center;
        font-style: italic;
      }

      .ol-layer-switcher__list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .ol-layer-switcher__item {
        padding: 8px;
        border-bottom: 1px solid #eee;
      }

      .ol-layer-switcher__item:last-child {
        border-bottom: none;
      }

      .ol-layer-switcher__label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .ol-layer-switcher__checkbox {
        cursor: pointer;
      }

      .ol-layer-switcher__name {
        flex: 1;
        font-weight: 500;
      }

      .ol-layer-switcher__type {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        text-transform: uppercase;
        background: #e0e0e0;
        color: #666;
      }

      .ol-layer-switcher__type--vector {
        background: #e3f2fd;
        color: #1976d2;
      }

      .ol-layer-switcher__type--tile {
        background: #e8f5e9;
        color: #388e3c;
      }

      .ol-layer-switcher__type--image {
        background: #fff3e0;
        color: #f57c00;
      }

      .ol-layer-switcher__opacity {
        width: 100%;
        margin-top: 8px;
        cursor: pointer;
      }
    `,
  ],
})
export class OlLayerSwitcherComponent {
  protected layerService = inject(OlLayerService);

  position = input<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  collapsible = input<boolean>(true);
  showOpacity = input<boolean>(false);
  startCollapsed = input<boolean>(false);

  protected isCollapsed = signal(this.startCollapsed());

  toggleCollapsed(): void {
    if (this.collapsible()) {
      this.isCollapsed.update((v: boolean) => !v);
    }
  }

  toggleLayer(id: string): void {
    this.layerService.toggleVisibility(id);
  }

  setOpacity(id: string, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.layerService.setOpacity(id, value);
  }
}
