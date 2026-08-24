import { describe, it, expect, vi } from 'vitest';
import { render } from '@angular-helpers/testing';
import { Subject } from 'rxjs';
import { OlDrawInteractionComponent } from './draw-interaction.component';
import { OlInteractionService } from '../services/interaction.service';

describe('OlDrawInteractionComponent', () => {
  let interactionServiceMock: any;
  let drawStart$: Subject<any>;
  let drawEnd$: Subject<any>;

  beforeEach(() => {
    drawStart$ = new Subject<any>();
    drawEnd$ = new Subject<any>();

    interactionServiceMock = {
      enableDraw: vi.fn(),
      disableInteraction: vi.fn(),
      drawStart$,
      drawEnd$,
    };
  });

  it('enables draw interaction when active is true', async () => {
    const { component } = await render(OlDrawInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'draw-point',
        type: 'Point',
        active: true,
        freehand: false,
        snapTolerance: 10,
      },
    });

    expect(component).toBeTruthy();
    expect(interactionServiceMock.enableDraw).toHaveBeenCalledWith('draw-point', {
      type: 'Point',
      source: undefined,
      freehand: false,
      snapTolerance: 10,
    });
  });

  it('disables interaction when active is false or component is destroyed', async () => {
    const { fixture } = await render(OlDrawInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'draw-poly',
        type: 'Polygon',
        active: true,
      },
    });

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(interactionServiceMock.disableInteraction).toHaveBeenCalledWith('draw-poly');

    fixture.destroy();
    expect(interactionServiceMock.disableInteraction).toHaveBeenCalledWith('draw-poly');
  });

  it('emits drawStart and drawEnd outputs when service emits matching events', async () => {
    const startEvents: any[] = [];
    const endEvents: any[] = [];

    await render(OlDrawInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'draw-line',
        type: 'LineString',
        active: true,
      },
      outputs: {
        drawStart: (e) => startEvents.push(e),
        drawEnd: (e) => endEvents.push(e),
      },
    });

    drawStart$.next({ interactionId: 'draw-line', feature: {} as any });
    drawStart$.next({ interactionId: 'other-draw', feature: {} as any });

    drawEnd$.next({ interactionId: 'draw-line', feature: {} as any, type: 'LineString' });

    expect(startEvents).toHaveLength(1);
    expect(endEvents).toHaveLength(1);
  });
});
