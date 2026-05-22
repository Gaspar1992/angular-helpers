import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Feature, Style } from '@angular-helpers/openlayers/core';

@Component({
  selector: 'ol-cluster',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlClusterComponent {
  distance = input<number>(40);
  minDistance = input<number>(20);
  showCount = input<boolean>(true);
  featureStyle = input<Style>();
  spiderfyOnSelect = input<boolean>(false);
  spiderfyClick = output<Feature>();
}
