import type { ServiceDoc } from '../models/doc-meta.model';

export const TESTING_SERVICES: ServiceDoc[] = [
  {
    id: 'render',
    name: 'render',
    description:
      'Lightweight, intuitive component rendering utility for modern Angular unit tests. Supports signals, inputs, outputs, template projections, and custom providers without verbose TestBed boilerplate.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment (Vitest / Jest / Playwright)',
    category: 'testing',
    notes: [
      'Automatically mounts standalone components into a managed test host.',
      'Supports setting input signals directly and intercepting output events.',
      'Includes query helpers (getByRole, getByText, queryByTestId) similar to Testing Library.',
      'Fully compatible with Zoneless Angular (Angular 22+).',
    ],
    methods: [],
    example: `import { render } from '@angular-helpers/testing';
import { UserCardComponent } from './user-card.component';

it('renders user name and handles action', async () => {
  const { getByText, fixture } = await render(UserCardComponent, {
    inputs: { name: 'Alice', role: 'Admin' },
  });

  expect(getByText('Alice')).toBeDefined();
});`,
  },
  {
    id: 'mock-service',
    name: 'provideMockService',
    description:
      'Creates auto-spied mocks for Angular services and providers. Replaces all methods with Vitest spies while preserving type signatures.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment (Vitest / Jest)',
    category: 'testing',
    notes: [
      'Inspects service prototype and stubs all methods with vi.fn().',
      'Provides the mock directly into TestBed or render() configuration.',
      'Preserves TypeScript types for full autocomplete on mock methods.',
    ],
    methods: [],
    example: `import { TestBed } from '@angular/core/testing';
import { provideMockService } from '@angular-helpers/testing';
import { AnalyticsService } from './analytics.service';

TestBed.configureTestingModule({
  providers: [provideMockService(AnalyticsService, { trackEvent: vi.fn() })],
});`,
  },
  {
    id: 'mock-component',
    name: 'MockComponent',
    description:
      'Creates lightweight stub components matching real component selectors and input/output contracts for shallow unit testing.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment',
    category: 'testing',
    notes: [
      'Prevents deep component rendering hierarchies from executing in unit tests.',
      'Captures input values for easy assertions.',
      'Renders <ng-content> slots seamlessly.',
    ],
    methods: [],
    example: `import { MockComponent } from '@angular-helpers/testing';
import { HeavyChartComponent } from './heavy-chart.component';

// In test imports:
TestBed.configureTestingModule({
  imports: [MockComponent(HeavyChartComponent)],
});`,
  },
  {
    id: 'mock-pipe',
    name: 'MockPipe',
    description:
      'Creates a stub pipe that returns input value directly or custom transforms for test isolation.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment',
    category: 'testing',
    notes: [
      'Isolates component templates from expensive pipe logic (e.g. date formatting, translations).',
    ],
    methods: [],
    example: `import { MockPipe } from '@angular-helpers/testing';
import { TranslatePipe } from './translate.pipe';

TestBed.configureTestingModule({
  imports: [MockPipe(TranslatePipe, (val) => val)],
});`,
  },
  {
    id: 'mock-router',
    name: 'provideMockRouter',
    description:
      'Provides a mock Angular Router with spy-backed navigation methods (navigate, navigateByUrl) and observable URL events.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment',
    category: 'testing',
    notes: [
      'Eliminates the need for provideRouter([]) and RouterTestingModule in unit tests.',
      'Exposes router.navigate as a spy for straightforward assertion.',
    ],
    methods: [],
    example: `import { TestBed } from '@angular/core/testing';
import { provideMockRouter } from '@angular-helpers/testing';

TestBed.configureTestingModule({
  providers: [provideMockRouter()],
});`,
  },
  {
    id: 'mock-activated-route',
    name: 'provideMockActivatedRoute',
    description:
      'Provides a mock ActivatedRoute with configurable params, queryParams, and data streams/signals.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment',
    category: 'testing',
    notes: [
      'Supports updating params dynamically during test execution.',
      'Provides both Observable and Signal forms of route state.',
    ],
    methods: [],
    example: `import { TestBed } from '@angular/core/testing';
import { provideMockActivatedRoute } from '@angular-helpers/testing';

TestBed.configureTestingModule({
  providers: [
    provideMockActivatedRoute({
      params: { id: '42' },
      queryParams: { tab: 'details' },
    }),
  ],
});`,
  },
  {
    id: 'mock-http',
    name: 'provideMockHttp',
    description:
      'In-memory HTTP backend and MockHttpController for testing HttpClient requests with fluent expectations and responses.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment',
    category: 'testing',
    notes: [
      'Modern, standalone alternative to HttpTestingController.',
      'Supports matching by URL, method, and headers.',
      'Works seamlessly with WorkerHttpClient and standard HttpClient.',
    ],
    methods: [],
    example: `import { TestBed } from '@angular/core/testing';
import { provideMockHttp, MockHttpController } from '@angular-helpers/testing';

TestBed.configureTestingModule({
  providers: [provideMockHttp()],
});
const httpCtrl = TestBed.inject(MockHttpController);
httpCtrl.expectOne('/api/items').flush([{ id: 1 }]);`,
  },
  {
    id: 'signal-testing',
    name: 'flushEffects',
    description:
      'Forces immediate synchronous evaluation of Angular effect() queues in test environments.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment',
    category: 'testing',
    notes: [
      'Essential for verifying side effects triggered by signal updates without arbitrary setTimeout/async delays.',
      'Operates synchronously within the active test execution frame.',
    ],
    methods: [],
    example: `import { signal, effect } from '@angular/core';
import { flushEffects } from '@angular-helpers/testing';

const count = signal(0);
let double = 0;
effect(() => { double = count() * 2; });

count.set(5);
flushEffects();
expect(double).toBe(10);`,
  },
  {
    id: 'environment-mocks',
    name: 'setupHeadlessBrowserMocks',
    description:
      'Installs comprehensive, deterministic headless browser mocks (ResizeObserver, IntersectionObserver, BroadcastChannel, WebCrypto, Canvas2D) into globalThis.',
    scope: 'provided',
    importPath: '@angular-helpers/testing',
    requiresSecureContext: false,
    browserSupport: 'Test environment (Node.js / jsdom / happy-dom)',
    category: 'testing',
    notes: [
      'Solves jsdom missing Web APIs globally across all unit tests.',
      'Safe to call in beforeEach or test-setup.ts — idempotent.',
      'Mocks include complete spy interfaces for observer triggering.',
    ],
    methods: [],
    example: `import { setupHeadlessBrowserMocks } from '@angular-helpers/testing';

// In vitest.setup.ts or individual spec:
setupHeadlessBrowserMocks();`,
  },
];
