import { TestBed } from '@angular/core/testing';

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
