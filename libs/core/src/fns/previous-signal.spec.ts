import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { previousSignal } from './previous-signal';

describe('previousSignal', () => {
  it('returns undefined initially and tracks previous values on change', () => {
    const count = signal(1);
    const prev = previousSignal(count);

    expect(prev()).toBeUndefined();

    count.set(2);
    expect(prev()).toBe(1);

    count.set(5);
    expect(prev()).toBe(2);
  });
});
