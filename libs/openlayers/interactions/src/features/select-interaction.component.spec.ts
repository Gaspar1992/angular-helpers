import { describe, it, expect, vi } from 'vitest';
import { render } from '@angular-helpers/testing';
import { Subject } from 'rxjs';
import { OlSelectInteractionComponent } from './select-interaction.component';
import { OlInteractionService } from '../services/interaction.service';

describe('OlSelectInteractionComponent', () => {
  let interactionServiceMock: any;
  let select$: Subject<any>;
  let hover$: Subject<any>;

  beforeEach(() => {
    select$ = new Subject<any>();
    hover$ = new Subject<any>();

    interactionServiceMock = {
      enableSelect: vi.fn(),
      disableInteraction: vi.fn(),
      select$,
      hover$,
    };
  });

  it('enables select interaction when active is true', async () => {
    const { component } = await render(OlSelectInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'select-1',
        layers: ['layer-1'],
        multi: true,
        hitTolerance: 5,
        condition: 'click',
        active: true,
      },
    });

    expect(component).toBeTruthy();
    expect(interactionServiceMock.enableSelect).toHaveBeenCalledWith('select-1', {
      layers: ['layer-1'],
      multi: true,
      hitTolerance: 5,
      condition: 'click',
    });
  });

  it('disables interaction when active is toggled false and on destroy', async () => {
    const { fixture } = await render(OlSelectInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'select-toggle',
        active: true,
      },
    });

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(interactionServiceMock.disableInteraction).toHaveBeenCalledWith('select-toggle');

    fixture.destroy();
    expect(interactionServiceMock.disableInteraction).toHaveBeenCalledWith('select-toggle');
  });

  it('emits selectEvent and hoverEvent when matching events arrive', async () => {
    const selectEvents: any[] = [];
    const hoverEvents: any[] = [];

    await render(OlSelectInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'select-events',
        active: true,
      },
      outputs: {
        selectEvent: (e) => selectEvents.push(e),
        hoverEvent: (e) => hoverEvents.push(e),
      },
    });

    select$.next({ interactionId: 'select-events', selected: [], deselected: [] });
    select$.next({ interactionId: 'other-select', selected: [], deselected: [] });

    hover$.next({ interactionId: 'select-events', hoveredId: 'h1', feature: null });

    expect(selectEvents).toHaveLength(1);
    expect(hoverEvents).toHaveLength(1);
  });
});
