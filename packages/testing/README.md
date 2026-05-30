# @angular-helpers/testing

Streamlined testing utilities for modern Angular applications. This package provides a lightweight wrapper over `TestBed` and various mocks to reduce boilerplate when writing unit and integration tests in Angular (specifically built with Signals, Standalone Components, and modern APIs in mind).

## Features

- **`render()`**: A lightweight, intuitive wrapper over `TestBed` to render standalone components, set signal inputs, bind outputs, and natively test `<ng-content>`.
- **Component & Pipe Mocks**: Easily mock standalone components (including `ControlValueAccessor` implementations) and pipes via `MockComponent()` and `MockPipe()`.
- **Service Mocks**: Use `provideMockService()` to instantly auto-spy on all methods of an Angular service (compatible with Vitest).
- **Routing Mocks**: `provideMockRouter()` and `provideMockActivatedRoute()` to simulate dynamic query parameters and route parameters easily using reactive observables.
- **HTTP Mocks**: `mockHttpRoute()` reduces boilerplate when flushing HTTP requests using `HttpTestingController`.
- **Signal Testing**: `flushEffects()` to manually trigger and evaluate `effect()` queues synchronously in your test environment.

## Installation

```bash
npm install @angular-helpers/testing --save-dev
# or
yarn add @angular-helpers/testing --dev
# or
pnpm add @angular-helpers/testing -D
```

## Usage

### 1. Rendering Components (`render`)

The `render()` function simplifies component testing by automatically creating the fixture, setting inputs, and providing DOM interaction helpers.

```typescript
import { render } from '@angular-helpers/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  it('should render and interact', async () => {
    const { fixture, component, click, type, query } = await render(MyComponent, {
      inputs: {
        title: 'Hello World', // Works with regular @Input() and Signal input()
      },
      outputs: {
        save: (data) => console.log('Saved', data), // Works with @Output() and output()
      },
    });

    // Interaction helpers
    type('input[name="username"]', 'JohnDoe');
    click('button[type="submit"]');

    // DOM querying
    expect(query('h1')?.textContent).toBe('Hello World');
  });

  it('should render with ng-content projection', async () => {
    // Automatically generates a host component
    const { query } = await render(MyComponent, {
      template: `<app-my-component><div class="projected">Content</div></app-my-component>`,
    });

    expect(query('.projected')).toBeTruthy();
  });
});
```

### 2. Mocking Services (`provideMockService`)

Automatically creates Vitest spies for all methods in the service prototype.

```typescript
import { provideMockService } from '@angular-helpers/testing';
import { DataService } from './data.service';

describe('FeatureComponent', () => {
  it('should use mocked service', async () => {
    await render(FeatureComponent, {
      providers: [
        provideMockService(DataService, {
          // Provide default implementations if needed
          getData: vi.fn().mockReturnValue(['Mocked Data']),
        }),
      ],
    });
  });
});
```

### 3. Mocking Components & Pipes (`MockComponent`, `MockPipe`)

Create dummy standalone components and pipes to isolate the unit under test.

```typescript
import { MockComponent, MockPipe } from '@angular-helpers/testing';

// Mocks a component, supporting inputs, outputs, and ControlValueAccessor models
const MyChildMock = MockComponent({
  selector: 'app-child',
  inputs: ['data'],
  outputs: ['changed'],
  models: ['value'], // Creates `value` input and `valueChange` output
});

// Mocks a pipe
const MyDateMock = MockPipe({
  name: 'myDate',
  transformFn: (value) => '2025-01-01',
});
```

### 4. Mocking Router & ActivatedRoute (`provideMockRouter`, `provideMockActivatedRoute`)

```typescript
import {
  provideMockRouter,
  provideMockActivatedRoute,
  MockActivatedRoute,
} from '@angular-helpers/testing';

describe('RouteComponent', () => {
  it('should navigate and read params', async () => {
    const { fixture } = await render(RouteComponent, {
      providers: [
        provideMockRouter(),
        provideMockActivatedRoute({
          params: { id: '123' },
          queryParams: { search: 'test' },
        }),
      ],
    });

    // Update params dynamically during the test without recreating the component
    const route = TestBed.inject(ActivatedRoute) as unknown as MockActivatedRoute;
    route.setParams({ id: '456' });
  });
});
```

### 5. Mocking HTTP Requests (`mockHttpRoute`)

Simplifies `HttpTestingController` assertions.

```typescript
import { mockHttpRoute } from '@angular-helpers/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('ApiIntegration', () => {
  it('should mock API call', async () => {
    await render(ApiComponent, {
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const httpMock = TestBed.inject(HttpTestingController);

    // One-liner to expect a route and flush the response
    mockHttpRoute(httpMock, '/api/users', [{ id: 1, name: 'Alice' }], { method: 'GET' });
  });
});
```

### 6. Signal Testing (`flushEffects`)

When testing Angular `effect()`, you need to flush the microtask queue manually to evaluate them synchronously.

```typescript
import { flushEffects } from '@angular-helpers/testing';

it('should trigger effect', () => {
  component.mySignal.set('new value');

  // Flush pending effects synchronously
  flushEffects();

  expect(component.effectResult).toBe('processed new value');
});
```

## Peer Dependencies

- `@angular/core` ^21.0.0
- `@angular/common` ^21.0.0
- `vitest` ^2.0.0 || ^3.0.0 || ^4.0.0
