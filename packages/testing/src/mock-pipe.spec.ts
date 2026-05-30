import { MockPipe } from './mock-pipe';

describe('MockPipe', () => {
  it('should return default arg', () => {
    const PipeClass = MockPipe({ name: 'myPipe' }) as any;
    const instance = new PipeClass();
    expect(instance.transform('test')).toBe('test');
  });

  it('should return mock transform', () => {
    const PipeClass = MockPipe({ name: 'myPipe', transformFn: () => 'mocked' }) as any;
    const instance = new PipeClass();
    expect(instance.transform('test')).toBe('mocked');
  });
});
