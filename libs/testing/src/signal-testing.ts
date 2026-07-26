import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';

/**
 * Flushes all pending Angular effects in the testing environment.
 *
 * In modern Angular, effects (effect()) are scheduled as microtasks.
 * When testing components or services that use effects, you must manually
 * flush them to evaluate the queue and assert the results synchronously.
 */
export function flushEffects(): void {
  TestBed.flushEffects();
}

/**
 * Creates a writable signal initialized with a starting value for component/service testing.
 */
export function createMockSignal<T>(initialValue: T): WritableSignal<T> {
  return signal<T>(initialValue);
}

/**
 * Executes an action that updates reactive state and automatically flushes pending Angular effects.
 */
export function withFlushedEffects(action: () => void): void {
  action();
  TestBed.flushEffects();
}
