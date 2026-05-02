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
 * Declarative component to configure an OpenLayers Draw Interaction.
 */
@Component({
  selector: 'ol-draw-interaction',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlDrawInteractionComponent {
  private interactionService = inject(OlInteractionService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  type = input.required<'Point' | 'LineString' | 'Polygon' | 'Circle'>();
  source = input<string>();
  freehand = input<boolean>();
  snapTolerance = input<number>();
  active = input<boolean>(true);

  private drawStartFiltered$ = this.interactionService.drawStart$.pipe(
    filter((e) => e.interactionId === this.id()),
  );

  private drawEndFiltered$ = this.interactionService.drawEnd$.pipe(
    filter((e) => e.interactionId === this.id()),
  );

  drawStart = outputFromObservable(this.drawStartFiltered$);
  drawEnd = outputFromObservable(this.drawEndFiltered$);

  constructor() {
    effect(() => {
      if (this.active()) {
        this.interactionService.enableDraw(this.id(), {
          type: this.type(),
          source: this.source(),
          freehand: this.freehand(),
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
