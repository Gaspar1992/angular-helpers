// Interaction state management service

import { computed, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import type { Feature } from '@angular-helpers/openlayers/core';
import type {
  DrawEndEvent,
  DrawStartEvent,
  ModifyEvent,
  SelectEvent,
  InteractionState,
} from '../models/interaction.types';
import type { ManagedInteraction } from './types';

/**
 * Service responsible for managing the reactive state of interactions.
 * Provides signals for interaction state and observables for events.
 */
@Injectable()
export class InteractionStateService {
  // Internal signals
  private interactions = signal<ManagedInteraction[]>([]);
  private selectedFeaturesInternal = signal<Feature[]>([]);

  // Event subjects
  private drawStartSubject = new Subject<DrawStartEvent>();
  private drawEndSubject = new Subject<DrawEndEvent>();
  private modifySubject = new Subject<ModifyEvent>();
  private selectSubject = new Subject<SelectEvent>();

  // Public readonly signals
  readonly selectedFeatures = computed(() => this.selectedFeaturesInternal());
  readonly selectionCount = computed(() => this.selectedFeaturesInternal().length);
  readonly hasSelection = computed(() => this.selectedFeaturesInternal().length > 0);
  readonly activeInteractions = computed(() =>
    this.interactions().filter((i) => i.config.active !== false),
  );

  // Public observables
  readonly drawStart$ = this.drawStartSubject.asObservable();
  readonly drawEnd$ = this.drawEndSubject.asObservable();
  readonly modify$ = this.modifySubject.asObservable();
  readonly select$ = this.selectSubject.asObservable();

  /**
   * Adds a managed interaction to the state.
   * If the interaction is marked as exclusive, it disables other exclusive interactions.
   * @param interaction - The interaction to add
   */
  addInteraction(interaction: ManagedInteraction): void {
    if (interaction.config.exclusive !== false) {
      // Disable other exclusive interactions to maintain mutual exclusivity
      const currentInteractions = this.interactions();
      for (const existing of currentInteractions) {
        if (existing.id !== interaction.id && existing.config.exclusive !== false) {
          existing.cleanup();
          this.removeInteraction(existing.id);
        }
      }
    }
    this.interactions.update((list) => [...list, interaction]);
  }

  /**
   * Removes an interaction by id.
   * @param id - The interaction identifier to remove
   */
  removeInteraction(id: string): void {
    this.interactions.update((list) => list.filter((i) => i.id !== id));
  }

  /**
   * Gets all managed interactions.
   * @returns Array of managed interactions
   */
  getInteractions(): ManagedInteraction[] {
    return this.interactions();
  }

  /**
   * Finds an interaction by id.
   * @param id - The interaction identifier
   * @returns The managed interaction or undefined
   */
  findInteraction(id: string): ManagedInteraction | undefined {
    return this.interactions().find((i) => i.id === id);
  }

  /**
   * Sets the currently selected features.
   * @param features - Array of selected features
   */
  setSelectedFeatures(features: Feature[]): void {
    this.selectedFeaturesInternal.set(features);
  }

  /**
   * Clears the current selection.
   */
  clearSelection(): void {
    this.selectedFeaturesInternal.set([]);
  }

  /**
   * Emits a draw start event.
   * @param event - The draw start event data
   */
  emitDrawStart(event: DrawStartEvent): void {
    this.drawStartSubject.next(event);
  }

  /**
   * Emits a draw end event.
   * @param event - The draw end event data
   */
  emitDrawEnd(event: DrawEndEvent): void {
    this.drawEndSubject.next(event);
  }

  /**
   * Emits a modify event.
   * @param event - The modify event data
   */
  emitModify(event: ModifyEvent): void {
    this.modifySubject.next(event);
  }

  /**
   * Emits a select event.
   * @param event - The select event data
   */
  emitSelect(event: SelectEvent): void {
    this.selectSubject.next(event);
  }

  /**
   * Gets the current interaction state summary.
   * @returns Array of interaction state objects
   */
  getInteractionState(): InteractionState[] {
    return this.interactions().map((i) => ({
      id: i.id,
      type: i.type,
      active: i.config.active !== false,
    }));
  }

  /**
   * Checks if an interaction is currently active.
   * @param id - The interaction identifier
   * @returns True if the interaction exists and is active
   */
  isActive(id: string): boolean {
    const interaction = this.findInteraction(id);
    return interaction ? interaction.config.active !== false : false;
  }

  /**
   * Clears all interactions from state.
   * Note: This only clears the state tracking, not the actual OL interactions.
   */
  clearAll(): void {
    this.interactions.set([]);
    this.selectedFeaturesInternal.set([]);
  }
}
