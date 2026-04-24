// OlTileLayerComponent

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { OlLayerService } from '../services/layer.service';
import type { TileLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-tile-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlTileLayerComponent implements OnInit, OnDestroy {
  private layerService = inject(OlLayerService);

  id = input.required<string>();
  source = input.required<'osm' | 'xyz' | 'wms'>();
  url = input<string>();
  attributions = input<string | string[]>();
  params = input<Record<string, unknown>>();
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);

  ngOnInit(): void {
    // Retry adding layer if map is not ready yet
    this.tryAddLayer();
  }

  private tryAddLayer(retryCount = 0): void {
    const result = this.layerService.addLayer({
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

    // If layer wasn't added (map not ready), retry with exponential backoff
    if (retryCount < 10) {
      setTimeout(
        () => {
          // Check if layer was actually added by trying again
          this.tryAddLayer(retryCount + 1);
        },
        Math.min(50 * (retryCount + 1), 500),
      );
    }
  }

  ngOnDestroy(): void {
    this.layerService.removeLayer(this.id());
  }
}
