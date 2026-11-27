import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { outputFromObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { OlInteractionService } from '../services/interaction.service';
import type { SelectHoverEvent } from '../models/interaction.types';

/**
 * Declarative component to configure an OpenLayers Select Interaction.
 */
@Component({
  selector: 'ol-select-interaction',
  template: '',
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
  hoverEvent = output<SelectHoverEvent>();

  constructor() {
    this.interactionService.hover$
      .pipe(
        filter((e) => e.interactionId === this.id()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.hoverEvent.emit(event);
      });

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
