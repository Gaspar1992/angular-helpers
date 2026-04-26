// OlTileLayerComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { OlLayerService } from '../services/layer.service';
import type { TileLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-tile-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  constructor() {
    // Initialize layer after DOM is ready
    afterNextRender(() => {
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
    });

    // Cleanup when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.layerService.removeLayer(this.id());
    });
  }
}
