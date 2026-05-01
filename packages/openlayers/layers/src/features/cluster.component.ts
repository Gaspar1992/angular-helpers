import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Style } from '@angular-helpers/openlayers/core';

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
}
