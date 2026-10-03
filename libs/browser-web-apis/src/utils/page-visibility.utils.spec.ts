import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPageVisibilitySupported, pageVisibilityStream } from './page-visibility.utils';
import { take } from 'rxjs';

describe('page-visibility.utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isPageVisibilitySupported returns true when document has hidden property', () => {
    expect(isPageVisibilitySupported()).toBe(true);
  });

  it('pageVisibilityStream emits initial visibilityState and subsequent changes', async () => {
    const emitted: string[] = [];
    const sub = pageVisibilityStream()
      .pipe(take(2))
      .subscribe((state) => emitted.push(state));

    // Simulate change event
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(emitted.length).toBe(2);
    expect(emitted[1]).toBe('hidden');
    sub.unsubscribe();
  });
});
