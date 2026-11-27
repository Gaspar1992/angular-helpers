import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import type { Feature, Style } from '@angular-helpers/openlayers/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ol-cluster',
  template: '',
})
export class OlClusterComponent {
  distance = input<number>(40);
  minDistance = input<number>(20);
  showCount = input<boolean>(true);
  featureStyle = input<Style>();
  spiderfyOnSelect = input<boolean>(false);
  spiderfyClick = output<Feature>();
}
