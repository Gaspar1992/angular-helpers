// OlImageLayerComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { OlLayerService } from '../services/layer.service';
import type { ImageLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-image-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlImageLayerComponent {
  private layerService = inject(OlLayerService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  sourceType = input.required<'wms' | 'static'>();
  url = input.required<string>();
  params = input<Record<string, unknown>>();
  imageExtent = input<[number, number, number, number]>();
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);

  constructor() {
    // Initialize layer after DOM is ready
    afterNextRender(() => {
      this.layerService.addLayer({
        id: this.id(),
        type: 'image',
        source: {
          type: this.sourceType(),
          url: this.url(),
          params: this.params(),
          imageExtent: this.imageExtent(),
        },
        zIndex: this.zIndex(),
        opacity: this.opacity(),
        visible: this.visible(),
      } as ImageLayerConfig);
    });

    // Cleanup when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.layerService.removeLayer(this.id());
    });
  }
}
