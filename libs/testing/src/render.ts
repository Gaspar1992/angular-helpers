import {
  Component,
  type EnvironmentProviders,
  type InputSignal,
  type InputSignalWithTransform,
  type ModelSignal,
  type OutputEmitterRef,
  type OutputRef,
  type OutputRefSubscription,
  type Provider,
  type Type,
} from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export type UnwrapSignalInput<V> =
  V extends InputSignalWithTransform<infer _T, infer TTransform>
    ? TTransform
    : V extends InputSignal<infer T>
      ? T
      : V extends ModelSignal<infer T>
        ? T
        : V;

export type UnwrapOutput<V> =
  V extends OutputEmitterRef<infer E>
    ? E
    : V extends OutputRef<infer E>
      ? E
      : V extends { subscribe(next: (value: infer E) => void): unknown }
        ? E
        : unknown;

export type ComponentInputs<T> = {
  [K in keyof T]?: UnwrapSignalInput<T[K]>;
};

export type ComponentOutputs<T> = {
  [K in keyof T]?: (event: UnwrapOutput<T[K]>) => void;
};

export interface RenderOptions<T> {
  imports?: (Type<unknown> | readonly unknown[])[];
  providers?: (Provider | EnvironmentProviders)[];
  inputs?: ComponentInputs<T>;
  outputs?: ComponentOutputs<T>;
  hostProperties?: Record<string, unknown>;
  detectInitialChanges?: boolean;
  template?: string;
}

function matchesText(content: string | null | undefined, matcher: string | RegExp): boolean {
  const normalized = (content ?? '').trim();
  return typeof matcher === 'string' ? normalized.includes(matcher) : matcher.test(normalized);
}

export class RenderResult<T> {
  constructor(
    public fixture: ComponentFixture<unknown>,
    public component: T,
  ) {
    this.query = this.query.bind(this);
    this.queryAll = this.queryAll.bind(this);
    this.getByText = this.getByText.bind(this);
    this.getByRole = this.getByRole.bind(this);
    this.getByLabelText = this.getByLabelText.bind(this);
    this.rerender = this.rerender.bind(this);
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

  getByText(text: string | RegExp): HTMLElement {
    const root = this.fixture.nativeElement as HTMLElement;
    const all = Array.from(root.querySelectorAll<HTMLElement>('*'));
    const match = all.find((el) => {
      if (el.children.length > 0) {
        const directText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent ?? '')
          .join(' ');
        return matchesText(directText, text);
      }
      return matchesText(el.textContent, text);
    });
    if (!match) {
      throw new Error(`Unable to find element with text: ${String(text)}`);
    }
    return match;
  }

  getByRole(role: string, options?: { name?: string | RegExp }): HTMLElement {
    const root = this.fixture.nativeElement as HTMLElement;
    const implicitSelectors: Record<string, string> = {
      button: 'button, input[type="button"], input[type="submit"], [role="button"]',
      link: 'a[href], [role="link"]',
      textbox:
        'input:not([type]), input[type="text"], input[type="email"], input[type="search"], textarea, [role="textbox"]',
      checkbox: 'input[type="checkbox"], [role="checkbox"]',
      heading: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
    };
    const selector = implicitSelectors[role] ?? `[role="${role}"]`;
    const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const match = options?.name
      ? candidates.find((el) =>
          matchesText(el.getAttribute('aria-label') ?? el.textContent, options.name!),
        )
      : candidates[0];
    if (!match) {
      throw new Error(
        `Unable to find element with role "${role}"${options?.name ? ` and name "${String(options.name)}"` : ''}`,
      );
    }
    return match;
  }

  getByLabelText(text: string | RegExp): HTMLElement {
    const root = this.fixture.nativeElement as HTMLElement;
    const ariaMatch = Array.from(root.querySelectorAll<HTMLElement>('[aria-label]')).find((el) =>
      matchesText(el.getAttribute('aria-label'), text),
    );
    if (ariaMatch) {
      return ariaMatch;
    }

    const labels = Array.from(root.querySelectorAll<HTMLLabelElement>('label'));
    for (const label of labels) {
      if (!matchesText(label.textContent, text)) continue;
      if (label.htmlFor) {
        const escapedId =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(label.htmlFor)
            : label.htmlFor.replace(/([^\w-])/g, '\\$1');
        const target = root.querySelector<HTMLElement>(`#${escapedId}`);
        if (target) return target;
      }
      const nested = label.querySelector<HTMLElement>('input, textarea, select');
      if (nested) return nested;
    }

    throw new Error(`Unable to find form control with label: ${String(text)}`);
  }

  async rerender(inputs: ComponentInputs<T>): Promise<void> {
    for (const [key, val] of Object.entries(inputs)) {
      this.fixture.componentRef.setInput(key, val);
    }
    this.fixture.detectChanges();
    await this.fixture.whenStable();
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

  if (options.inputs && !options.template) {
    for (const [key, val] of Object.entries(options.inputs)) {
      fixture.componentRef.setInput(key, val);
    }
  }

  if (options.hostProperties && options.template) {
    Object.assign(fixture.componentInstance as object, options.hostProperties);
  }

  // Support for output binding (compatible with EventEmitter and Signal output())
  const outputSubs: OutputRefSubscription[] = [];
  if (options.outputs) {
    for (const key of Object.keys(options.outputs) as Array<keyof T>) {
      const outputProp = componentInstance[key] as
        | { subscribe?: (cb: (event: unknown) => void) => OutputRefSubscription | void }
        | undefined;
      const callback = options.outputs[key] as ((event: unknown) => void) | undefined;
      if (outputProp && typeof outputProp.subscribe === 'function' && callback) {
        const sub = outputProp.subscribe(callback);
        if (sub && typeof sub.unsubscribe === 'function') {
          outputSubs.push(sub);
        }
      }
    }
  }

  if (outputSubs.length > 0) {
    fixture.componentRef.onDestroy(() => {
      for (const sub of outputSubs) {
        sub.unsubscribe();
      }
    });
  }

  if (options.detectInitialChanges !== false) {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  return new RenderResult(fixture, componentInstance);
}
