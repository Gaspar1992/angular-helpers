import { provideMockService } from './mock-service';

class RealService {
  doSomething() {
    return 'real';
  }
  prop = 123;
}

describe('provideMockService', () => {
  it('should auto-spy on methods', () => {
    const provider: any = provideMockService(RealService);
    expect(provider.provide).toBe(RealService);
    expect(provider.useValue.doSomething).toBeDefined();
    expect(provider.useValue.doSomething.mock).toBeDefined();
    expect(provider.useValue.prop).toBeUndefined(); // non-methods are ignored
  });

  it('should accept overrides', () => {
    const provider: any = provideMockService(RealService, { prop: 456 });
    expect(provider.useValue.prop).toBe(456);
  });
});
