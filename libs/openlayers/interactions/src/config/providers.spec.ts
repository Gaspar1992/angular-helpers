import { describe, it, expect, vi } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector, Injector } from '@angular/core';
import {
  provideInteractions,
  withSelectInteraction,
  withDrawInteraction,
  withModifyInteraction,
  withMeasurementInteraction,
} from './providers';
import { OlInteractionService } from '../services/interaction.service';
import { InteractionStateService } from '../services/interaction-state.service';
import { SelectInteractionService } from '../services/select-interaction.service';
import { DrawInteractionService } from '../services/draw-interaction.service';
import { ModifyInteractionService } from '../services/modify-interaction.service';
import { MeasurementInteractionService } from '../services/measurement-interaction.service';
import { OlLayerService } from '@angular-helpers/openlayers/layers';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';

describe('Interactions Providers', () => {
  it('provideInteractions / withInteractions provides all interaction services', () => {
    const feature = provideInteractions();
    expect(feature.kind).toBe('interactions');

    const injector = Injector.create({
      providers: [
        { provide: OlMapService, useValue: { getMap: () => null } },
        {
          provide: OlZoneHelper,
          useValue: { runOutsideAngular: (fn: any) => fn(), runInsideAngular: (fn: any) => fn() },
        },
        ...feature.providers,
      ],
    });

    expect(injector.get(OlInteractionService)).toBeInstanceOf(OlInteractionService);
    expect(injector.get(InteractionStateService)).toBeInstanceOf(InteractionStateService);
    expect(injector.get(SelectInteractionService)).toBeInstanceOf(SelectInteractionService);
    expect(injector.get(DrawInteractionService)).toBeInstanceOf(DrawInteractionService);
    expect(injector.get(ModifyInteractionService)).toBeInstanceOf(ModifyInteractionService);
    expect(injector.get(MeasurementInteractionService)).toBeInstanceOf(
      MeasurementInteractionService,
    );
    expect(injector.get(OlLayerService)).toBeInstanceOf(OlLayerService);
  });

  it('withSelectInteraction initializes select config on OlInteractionService', () => {
    const mockInteractionService = {
      enableSelect: vi.fn(),
    };

    const feature = withSelectInteraction('sel-1', { multi: true });
    expect(feature.kind).toBe('interactions');

    const parent = Injector.create({ providers: [] }) as EnvironmentInjector;
    const injector = createEnvironmentInjector(
      [{ provide: OlInteractionService, useValue: mockInteractionService }, ...feature.providers],
      parent,
    );

    expect(mockInteractionService.enableSelect).toHaveBeenCalledWith('sel-1', { multi: true });
    injector.destroy();
  });

  it('withDrawInteraction initializes draw config on OlInteractionService', () => {
    const mockInteractionService = {
      enableDraw: vi.fn(),
    };

    const feature = withDrawInteraction('draw-1', { type: 'Point' });
    expect(feature.kind).toBe('interactions');

    const parent = Injector.create({ providers: [] }) as EnvironmentInjector;
    const injector = createEnvironmentInjector(
      [{ provide: OlInteractionService, useValue: mockInteractionService }, ...feature.providers],
      parent,
    );

    expect(mockInteractionService.enableDraw).toHaveBeenCalledWith('draw-1', { type: 'Point' });
    injector.destroy();
  });

  it('withModifyInteraction initializes modify config on OlInteractionService', () => {
    const mockInteractionService = {
      enableModify: vi.fn(),
    };

    const feature = withModifyInteraction('mod-1', { snapTolerance: 20 });
    expect(feature.kind).toBe('interactions');

    const parent = Injector.create({ providers: [] }) as EnvironmentInjector;
    const injector = createEnvironmentInjector(
      [{ provide: OlInteractionService, useValue: mockInteractionService }, ...feature.providers],
      parent,
    );

    expect(mockInteractionService.enableModify).toHaveBeenCalledWith('mod-1', {
      snapTolerance: 20,
    });
    injector.destroy();
  });

  it('withMeasurementInteraction injects MeasurementInteractionService', () => {
    const mockMeasurementService = {};
    const feature = withMeasurementInteraction();
    expect(feature.kind).toBe('interactions');

    const parent = Injector.create({ providers: [] }) as EnvironmentInjector;
    const injector = createEnvironmentInjector(
      [
        { provide: MeasurementInteractionService, useValue: mockMeasurementService },
        ...feature.providers,
      ],
      parent,
    );

    expect(injector.get(MeasurementInteractionService)).toBe(mockMeasurementService);
    injector.destroy();
  });
});
