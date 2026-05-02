// OlLayerSwitcherComponent - UI control for managing layer visibility

import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LayerSwitcherItem } from '../models/layer-switcher.types';

/**
 * A reusable layer switcher control that displays all layers
 * and allows toggling their visibility.
 *
 * @usageNotes
 * ```html
 * <ol-layer-switcher
 *   position="top-right"
 *   [layers]="layerItems()"
 *   [collapsible]="true"
 *   [showOpacity]="true"
 *   (visibilityChange)="onVisibilityChange($event)"
 *   (opacityChange)="onOpacityChange($event)">
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
        <span class="ol-layer-switcher__icon"
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
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline></svg
        ></span>
        <span class="ol-layer-switcher__title">Layers</span>
      </button>

      @if (!isCollapsed()) {
        <div class="ol-layer-switcher__panel">
          @if (layers(); as layerList) {
            @if (layerList.length === 0) {
              <div class="ol-layer-switcher__empty">No layers</div>
            } @else {
              <ul class="ol-layer-switcher__list">
                @for (layer of layerList; track layer.id) {
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
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        border-radius: 4px;
        border: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        min-width: 36px;
        z-index: 100;
        transition: all 0.2s ease;
      }

      .ol-layer-switcher--top-left {
        top: 0.5em;
        left: 0.5em;
      }

      .ol-layer-switcher--top-right {
        top: 10em;
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
        gap: 6px;
        padding: 4px 8px;
        background: transparent;
        color: #333;
        border: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        width: 100%;
        font-size: 13px;
        font-weight: 600;
        transition: background 0.15s ease;
        min-height: 36px;
      }

      .ol-layer-switcher.collapsed .ol-layer-switcher__toggle {
        border-bottom: none;
        border-radius: 4px;
        padding: 4px 6px;
        justify-content: center;
      }

      .ol-layer-switcher__toggle:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .ol-layer-switcher__icon {
        font-size: 14px;
        line-height: 1;
      }

      .ol-layer-switcher__title {
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .ol-layer-switcher.collapsed .ol-layer-switcher__title,
      .ol-layer-switcher.collapsed .ol-layer-switcher__panel {
        display: none;
      }

      .ol-layer-switcher__panel {
        padding: 6px;
        max-height: 300px;
        overflow-y: auto;
      }

      .ol-layer-switcher__empty {
        padding: 12px;
        color: #6b7280;
        text-align: center;
        font-style: italic;
        font-size: 12px;
      }

      .ol-layer-switcher__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .ol-layer-switcher__item {
        padding: 5px 8px;
        border-radius: 3px;
        transition: background 0.15s ease;
      }

      .ol-layer-switcher__item:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      .ol-layer-switcher__label {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 12px;
      }

      .ol-layer-switcher__checkbox {
        cursor: pointer;
        accent-color: #1a73e8;
      }

      .ol-layer-switcher__name {
        flex: 1;
        font-weight: 500;
        color: #333;
        font-size: 12px;
      }

      .ol-layer-switcher__type {
        font-size: 9px;
        padding: 2px 5px;
        border-radius: 3px;
        font-weight: 700;
        text-transform: uppercase;
        background: rgba(0, 0, 0, 0.06);
        color: #555;
        letter-spacing: 0.3px;
      }

      .ol-layer-switcher__type--vector {
        background: rgba(59, 130, 246, 0.12);
        color: #2563eb;
      }

      .ol-layer-switcher__type--tile {
        background: rgba(34, 197, 94, 0.12);
        color: #16a34a;
      }

      .ol-layer-switcher__type--image {
        background: rgba(245, 158, 11, 0.12);
        color: #d97706;
      }

      .ol-layer-switcher__opacity {
        width: 100%;
        margin-top: 4px;
        cursor: pointer;
        height: 4px;
        accent-color: #1a73e8;
      }
    `,
  ],
})
export class OlLayerSwitcherComponent {
  position = input<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  layers = input<LayerSwitcherItem[]>([]);
  collapsible = input<boolean>(true);
  showOpacity = input<boolean>(false);
  startCollapsed = input<boolean>(false);

  visibilityChange = output<{ id: string; visible: boolean }>();
  opacityChange = output<{ id: string; opacity: number }>();

  protected isCollapsed = signal(false);

  toggleCollapsed(): void {
    if (this.collapsible()) {
      this.isCollapsed.update((v: boolean) => !v);
    }
  }

  toggleLayer(id: string): void {
    const layer = this.layers().find((l) => l.id === id);
    if (layer) {
      this.visibilityChange.emit({ id, visible: !layer.visible });
    }
  }

  setOpacity(id: string, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.opacityChange.emit({ id, opacity: value });
  }
}
