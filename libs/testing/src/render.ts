import { Component, type Provider, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export interface RenderOptions<T> {
  imports?: (Type<unknown> | readonly unknown[])[];
  providers?: Provider[];
  inputs?: Partial<T>;
  outputs?: Partial<Record<keyof T, (event: unknown) => void>>;
  hostProperties?: Record<string, unknown>;
  detectInitialChanges?: boolean;
  template?: string;
}

export class RenderResult<T> {
  constructor(
    public fixture: ComponentFixture<unknown>,
    public component: T,
  ) {
    this.query = this.query.bind(this);
    this.queryAll = this.queryAll.bind(this);
    this.click = this.click.bind(this);
    this.type = this.type.bind(this);
    this.fillForm = this.fillForm.bind(this);
  }

  query(selector: string): Element | null {
    return this.fixture.nativeElement.querySelector(selector);
  }

  queryAll(selector: string): NodeListOf<Element> {
    return this.fixture.nativeElement.querySelectorAll(selector);
  }

  click(selector: string): void {
    const el = this.query(selector) as HTMLElement;
    if (el) {
      el.click();
      this.fixture.detectChanges();
    } else {
      throw new Error(`Element not found for selector: ${selector}`);
    }
  }

  type(selector: string, value: string): void {
    const el = this.query(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (!el) {
      throw new Error(`Element not found for selector: ${selector}`);
    }

    // Assign value simulating user behavior
    el.value = value;

    // Dispatch native events so Angular reactive systems catch the change
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));

    this.fixture.detectChanges();
  }

  fillForm(selector: string, data: Record<string, string>): void {
    const form = this.query(selector);
    if (!form) {
      throw new Error(`Form not found for selector: ${selector}`);
    }

    Object.entries(data).forEach(([name, value]) => {
      const inputSelector = `${selector} [name="${name}"], ${selector} #${name}`;
      this.type(inputSelector, value);
    });
  }
}

/**
 * A lightweight wrapper over TestBed to render Standalone Components with less boilerplate.
 * Supports setting initial signal inputs and wrapping in dynamic hosts for <ng-content>.
 *
 * @param componentType The standalone component to render.
 * @param options Providers, inputs, and optional template string for Host wrapping.
 * @returns A RenderResult containing the fixture, instance, and DOM helpers.
 */
export async function render<T>(
  componentType: Type<T>,
  options: RenderOptions<T> = {},
): Promise<RenderResult<T>> {
  let fixture: ComponentFixture<unknown>;
  let componentInstance: T;

  if (options.template) {
    // Generate a dynamic HostComponent to allow testing <ng-content> projections natively
    class DynamicHostComponent {}
    const decorator = Component({
      template: options.template,
      imports: [componentType, ...(options.imports || [])],
    });
    const HostType = decorator(DynamicHostComponent) as Type<unknown>;

    await TestBed.configureTestingModule({
      imports: [HostType, ...(options.imports || [])],
      providers: options.providers || [],
    }).compileComponents();

    fixture = TestBed.createComponent(HostType);

    const debugEl = fixture.debugElement.query(By.directive(componentType));
    if (!debugEl) {
      throw new Error(`Could not find directive or component in the provided template.`);
    }
    componentInstance = debugEl.injector.get(componentType);
  } else {
    await TestBed.configureTestingModule({
      imports: [componentType, ...(options.imports || [])],
      providers: options.providers || [],
    }).compileComponents();

    fixture = TestBed.createComponent(componentType);
    componentInstance = fixture.componentInstance as T;
  }

  if (options.inputs) {
    if (options.template) {
      // In host templates, inputs should be bound natively in the template using hostProperties.
    } else {
      for (const [key, val] of Object.entries(options.inputs)) {
        fixture.componentRef.setInput(key, val);
      }
    }
  }

  if (options.hostProperties && options.template) {
    Object.assign(fixture.componentInstance as object, options.hostProperties);
  }

  // Support for output binding (compatible with EventEmitter and Signal output())
  if (options.outputs) {
    for (const key of Object.keys(options.outputs) as Array<keyof T>) {
      const outputProp = componentInstance[key] as
        | { subscribe?: (cb: (event: unknown) => void) => void }
        | undefined;
      const callback = options.outputs[key];
      if (outputProp && typeof outputProp.subscribe === 'function' && callback) {
        outputProp.subscribe(callback);
      }
    }
  }

  if (options.detectInitialChanges !== false) {
    fixture.detectChanges();
  }

  return new RenderResult(fixture, componentInstance);
}
