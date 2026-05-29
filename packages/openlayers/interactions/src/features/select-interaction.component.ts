import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { OlInteractionService } from '../services/interaction.service';

/**
 * Declarative component to configure an OpenLayers Select Interaction.
 */
@Component({
  selector: 'ol-select-interaction',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlSelectInteractionComponent {
  private interactionService = inject(OlInteractionService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  layers = input<string[]>();
  multi = input<boolean>();
  hitTolerance = input<number>();
  condition = input<'click' | 'pointerMove'>();
  active = input<boolean>(true);

  private selectFiltered$ = this.interactionService.select$.pipe(
    filter((e) => e.interactionId === this.id()),
  );

  selectEvent = outputFromObservable(this.selectFiltered$);

  constructor() {
    effect(() => {
      if (this.active()) {
        this.interactionService.enableSelect(this.id(), {
          layers: this.layers(),
          multi: this.multi(),
          hitTolerance: this.hitTolerance(),
          condition: this.condition(),
        });
      } else {
        this.interactionService.disableInteraction(this.id());
      }
    });

    this.destroyRef.onDestroy(() => {
      this.interactionService.disableInteraction(this.id());
    });
  }
}
