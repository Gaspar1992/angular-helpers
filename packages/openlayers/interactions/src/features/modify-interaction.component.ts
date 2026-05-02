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
 * Declarative component to configure an OpenLayers Modify Interaction.
 */
@Component({
  selector: 'ol-modify-interaction',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlModifyInteractionComponent {
  private interactionService = inject(OlInteractionService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  source = input<string>();
  snapTolerance = input<number>();
  active = input<boolean>(true);

  private modifyFiltered$ = this.interactionService.modify$.pipe(
    filter((e) => e.interactionId === this.id()),
  );

  modifyEvent = outputFromObservable(this.modifyFiltered$);

  constructor() {
    effect(() => {
      if (this.active()) {
        this.interactionService.enableModify(this.id(), {
          source: this.source(),
          snapTolerance: this.snapTolerance(),
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
