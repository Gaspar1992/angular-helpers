import { provideMockRouter } from './mock-router';
import { Router } from '@angular/router';

describe('provideMockRouter', () => {
  it('should return a Provider with mocked Router methods', () => {
    const provider: any = provideMockRouter();
    expect(provider.provide).toBe(Router);
    expect(provider.useValue.navigate).toBeDefined();
    expect(provider.useValue.navigate.mock).toBeDefined();
    expect(provider.useValue.navigateByUrl).toBeDefined();
  });
});
