# 🧪 @angular-helpers/testing

Lightweight, zoneless-first Angular 22+ component and signal testing utilities — `render()` with strongly typed `ComponentInputs<T>` / `ComponentOutputs<T>`, semantic DOM queries (`getByRole`, `getByText`, `getByLabelText`), `rerender()`, and async signal flush helpers.

---

## Quick Path

### 1. Installation

```bash
pnpm add -D @angular-helpers/testing
```

### 2. Rendering & Semantic Queries

```typescript
import { provideZonelessChangeDetection } from '@angular/core';
import { render } from '@angular-helpers/testing';
import { vi, expect, it } from 'vitest';
import { ProfileCardComponent } from './profile-card.component';

it('renders inputs, handles semantic queries, and emits typed outputs', async () => {
  const onSave = vi.fn<(id: string) => void>();

  const view = await render(ProfileCardComponent, {
    providers: [provideZonelessChangeDetection()],
    inputs: { name: 'Ada' },
    outputs: { saved: onSave },
  });

  expect(view.getByText('Ada')).toBeTruthy();
  view.getByRole('button', { name: 'Save' }).click();
  expect(onSave).toHaveBeenCalledWith('ada-1');

  await view.rerender({ name: 'Grace' });
  expect(view.getByText('Grace')).toBeTruthy();
});
```

---

## Core Primitives

| Primitive                                    | Description                                                                                       |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `render(component, options?)`                | Renders standalone components with typed `inputs`, `outputs`, and optional projection `template`. |
| `getByText` / `getByRole` / `getByLabelText` | Semantic, accessibility-friendly DOM queries on `RenderResult<T>`.                                |
| `rerender(inputs)`                           | Updates signal inputs via `ComponentRef.setInput()` and stabilizes the fixture.                   |
| `createSignalHarness()`                      | Reactive signal testing harness and `flushMicrotasks()` utilities.                                |
| `mockBrowserApis()`                          | SSR/Vitest-safe mocks for `matchMedia`, observers, clipboard, and storage.                        |

---

## Interactive Documentation

👉 **[Testing Docs](https://gaspar1992.github.io/angular-helpers/docs/testing)**

## License

MIT
