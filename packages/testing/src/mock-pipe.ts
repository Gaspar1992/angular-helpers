import { Pipe, type Type } from '@angular/core';

export interface MockPipeOptions {
  name: string;
  transformFn?: (...args: any[]) => any;
}

/**
 * Creates a simple dummy standalone Pipe.
 *
 * @param options Configuration for the mock pipe (name, transformFn).
 * @returns A standalone dummy pipe class typed as T.
 */
export function MockPipe<T>(options: MockPipeOptions): Type<T> {
  class DummyPipe {
    transform(...args: any[]) {
      if (options.transformFn) {
        return options.transformFn(...args);
      }
      // By default, just return the first argument identically.
      return args[0];
    }
  }

  // Apply the decorator dynamically so the AOT compiler doesn't throw static analysis errors
  const decorator = Pipe({
    name: options.name,
  });

  return decorator(DummyPipe) as unknown as Type<T>;
}
