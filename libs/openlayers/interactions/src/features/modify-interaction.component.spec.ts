import { describe, it, expect, vi } from 'vitest';
import { render } from '@angular-helpers/testing';
import { Subject } from 'rxjs';
import { OlModifyInteractionComponent } from './modify-interaction.component';
import { OlInteractionService } from '../services/interaction.service';

describe('OlModifyInteractionComponent', () => {
  let interactionServiceMock: any;
  let modify$: Subject<any>;

  beforeEach(() => {
    modify$ = new Subject<any>();

    interactionServiceMock = {
      enableModify: vi.fn(),
      disableInteraction: vi.fn(),
      modify$,
    };
  });

  it('enables modify interaction when active is true', async () => {
    const { component } = await render(OlModifyInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'modify-1',
        source: 'vector-source-1',
        snapTolerance: 12,
        active: true,
      },
    });

    expect(component).toBeTruthy();
    expect(interactionServiceMock.enableModify).toHaveBeenCalledWith('modify-1', {
      source: 'vector-source-1',
      snapTolerance: 12,
    });
  });

  it('disables interaction when active is false and on destroy', async () => {
    const { fixture } = await render(OlModifyInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'modify-toggle',
        active: true,
      },
    });

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(interactionServiceMock.disableInteraction).toHaveBeenCalledWith('modify-toggle');

    fixture.destroy();
    expect(interactionServiceMock.disableInteraction).toHaveBeenCalledWith('modify-toggle');
  });

  it('emits modifyEvent when matching event arrives', async () => {
    const events: any[] = [];

    await render(OlModifyInteractionComponent, {
      providers: [{ provide: OlInteractionService, useValue: interactionServiceMock }],
      inputs: {
        id: 'mod-listen',
        active: true,
      },
      outputs: {
        modifyEvent: (e) => events.push(e),
      },
    });

    modify$.next({ interactionId: 'mod-listen', features: [], type: 'modifystart' });
    modify$.next({ interactionId: 'other-mod', features: [], type: 'modifystart' });

    expect(events).toHaveLength(1);
    expect(events[0].interactionId).toBe('mod-listen');
  });
});
