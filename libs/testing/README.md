# 🧪 @angular-helpers/testing

Streamlined testing utilities and intuitive mocks for modern Angular applications. Provides a lightweight, ergonomic `render()` wrapper over `TestBed` designed specifically for Angular Signals, Standalone Components, and Zoneless testing with Vitest and Jest.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/testing -D
```

### 2. Component Testing with `render()`

```typescript
import { Component, input, output } from '@angular/core';
import { render } from '@angular-helpers/testing';

@Component({
  selector: 'app-user-card',
  template: `
    <h2>{{ name() }}</h2>
    <button (click)="select.emit(name())">Select</button>
  `,
})
export class UserCardComponent {
  readonly name = input.required<string>();
  readonly select = output<string>();
}

// In test suite:
describe('UserCardComponent', () => {
  it('should render and interact seamlessly', async () => {
    let selectedName = '';
    const { query, click } = await render(UserCardComponent, {
      inputs: { name: 'Alice' },
      outputs: { select: (val: string) => (selectedName = val) },
    });

    expect(query('h2')?.textContent).toBe('Alice');
    click('button');
    expect(selectedName).toBe('Alice');
  });
});
```

---

## Testing Utilities Matrix

| Utility                                | Domain                | Description                                                                                           |
| :------------------------------------- | :-------------------- | :---------------------------------------------------------------------------------------------------- |
| `render(component, options)`           | **Component Testing** | Instantiates component, binds Signal `input()` and `output()`, and returns query/interaction helpers. |
| `MockComponent(component, options)`    | **Mocking**           | Creates lightweight standalone mock representations of child components (supporting CVA).             |
| `MockPipe(pipe, transformFn)`          | **Mocking**           | Generates mock pipes with custom transform behavior.                                                  |
| `provideMockService(serviceClass)`     | **DI Mocks**          | Auto-spies on every method of an Angular service (Vitest & Jest compatible).                          |
| `provideMockRouter(options)`           | **Routing Mocks**     | Simulates `Router` navigation without loading route trees.                                            |
| `provideMockActivatedRoute(state)`     | **Routing Mocks**     | Simulates `paramMap`, `queryParams`, and route data observables/signals.                              |
| `mockHttpRoute(controller, url, resp)` | **HTTP Mocks**        | Expressive single-line HTTP mock responder for `HttpTestingController`.                               |
| `flushEffects()`                       | **Signals**           | Synchronously evaluates pending `effect()` notification queues in the test environment.               |

---

## Key Guarantees

- **Signals-First**: Seamlessly sets both classic `@Input()` and modern `input()` signals.
- **Content Projection**: Pass inline template with `<ng-content>` projection and test wrapper hosts automatically.
- **Zero Boilerplate**: Replaces repetitive `TestBed.configureTestingModule`, `createComponent`, and `detectChanges` with one `render()` call.
- **Runner Agnostic**: Built for Vitest, Jest, and Karma test environments.

---

## Interactive Documentation & Demos

API guides and testing patterns:
👉 **[Angular Helpers Testing Docs](https://gaspar1992.github.io/angular-helpers/docs/testing)**

---

## License

MIT
