// OlImageLayerComponent

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { OlLayerService } from '../services/layer.service';
import type { ImageLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-image-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlImageLayerComponent implements OnInit, OnDestroy {
  private layerService = inject(OlLayerService);

  id = input.required<string>();
  sourceType = input.required<'wms' | 'static'>();
  url = input.required<string>();
  params = input<Record<string, unknown>>();
  imageExtent = input<[number, number, number, number]>();
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);

  ngOnInit(): void {
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
  }

  ngOnDestroy(): void {
    this.layerService.removeLayer(this.id());
  }
}
