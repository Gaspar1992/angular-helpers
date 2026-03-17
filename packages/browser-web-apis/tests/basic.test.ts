import { describe, it, expect } from 'vitest';
import { version } from '../src/public-api';

describe('browser-web-apis', () => {
  it('should have correct version', () => {
    expect(version).toBe('0.1.0');
  });
});
