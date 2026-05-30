import { Component, EventEmitter, Type, Provider, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface MockOptions {
  selector: string;
  inputs?: string[];
  outputs?: string[];
  models?: string[];
  providers?: Provider[];
  originalComponent?: Type<any>;
}

/**
 * Creates a simple dummy standalone component for the given options.
 * This approach requires explicit declaration of selector, inputs, and outputs.
 *
 * @param options Configuration for the mock component.
 * @returns A standalone dummy component class typed as T.
 */
export function MockComponent<T>(options: MockOptions): Type<T> {
  const mergedInputs = [...(options.inputs || [])];
  const mergedOutputs = [...(options.outputs || [])];
  const providers = [...(options.providers || [])];

  if (options.models) {
    options.models.forEach((model) => {
      mergedInputs.push(model);
      mergedOutputs.push(`${model}Change`);
    });
  }

  // Check if original component implements ControlValueAccessor
  const isCVA =
    options.originalComponent &&
    typeof options.originalComponent.prototype.writeValue === 'function' &&
    typeof options.originalComponent.prototype.registerOnChange === 'function';

  class DummyComponent implements ControlValueAccessor {
    constructor() {
      mergedOutputs.forEach((output) => {
        (this as any)[output] = new EventEmitter<any>();
      });
    }

    // Dummy CVA implementations
    writeValue(obj: any): void {}
    registerOnChange(fn: any): void {}
    registerOnTouched(fn: any): void {}
    setDisabledState?(isDisabled: boolean): void {}
  }

  if (isCVA) {
    providers.push({
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DummyComponent),
      multi: true,
    });
  }

  const decorator = Component({
    selector: options.selector,
    template: '',
    standalone: true,
    inputs: mergedInputs,
    outputs: mergedOutputs,
    providers: providers,
  });

  return decorator(DummyComponent) as unknown as Type<T>;
}
