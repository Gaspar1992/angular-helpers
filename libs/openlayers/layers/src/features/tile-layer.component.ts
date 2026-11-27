// OlTileLayerComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { OlLayerService } from '../services/layer.service';
import type { TileLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-tile-layer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class OlTileLayerComponent {
  private layerService = inject(OlLayerService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  source = input.required<'osm' | 'xyz' | 'wms'>();
  url = input<string>();
  attributions = input<string | string[]>();
  params = input<Record<string, unknown>>();
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);

  private initialized = false;

  constructor() {
    // Initialize layer after DOM is ready
    afterNextRender(() => {
      this.initialized = true;
      this.addOrReplaceLayer();
    });

    effect(() => {
      const _id = this.id();
      const _source = this.source();
      const _url = this.url();
      const _attributions = this.attributions();
      const _params = this.params();
      if (!this.initialized) return;
      this.layerService.removeLayer(_id);
      this.addOrReplaceLayer();
    });

    effect(() => {
      this.layerService.setOpacity(this.id(), this.opacity());
    });

    effect(() => {
      this.layerService.setVisibility(this.id(), this.visible());
    });

    effect(() => {
      this.layerService.setZIndex(this.id(), this.zIndex());
    });

    // Cleanup when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.layerService.removeLayer(this.id());
    });
  }

  private addOrReplaceLayer(): void {
    this.layerService.addLayer({
      id: this.id(),
      type: 'tile',
      source: {
        type: this.source(),
        url: this.url(),
        attributions: this.attributions(),
        params: this.params(),
      },
      zIndex: this.zIndex(),
      opacity: this.opacity(),
      visible: this.visible(),
    } as TileLayerConfig);
  }
}
