// OlVectorLayerComponent

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import type { Feature, Style } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '../services/layer.service';
import type { VectorLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-vector-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlVectorLayerComponent implements OnInit, OnDestroy {
  private layerService = inject(OlLayerService);
  id = input.required<string>();
  features = input<Feature[]>([]);
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);
  style = input<Style | ((feature: Feature) => Style)>();

  ngOnInit(): void {
    this.layerService.addLayer({
      id: this.id(),
      type: 'vector',
      features: this.features(),
      zIndex: this.zIndex(),
      opacity: this.opacity(),
      visible: this.visible(),
      style: this.style(),
    } as VectorLayerConfig);
  }
  ngOnDestroy(): void {
    this.layerService.removeLayer(this.id());
  }
}
