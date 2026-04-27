import type { BlogPost } from '../models/blog-post.model';

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: 'openlayers-military',
    title:
      'openlayers v0.4.0: Military symbology — Ellipse, Sector, Donut, and lazy-loaded MIL-STD-2525',
    publishedAt: '2026-04-27',
    tags: [
      'openlayers',
      'angular',
      'maps',
      'military',
      'milsymbol',
      'mil-std-2525',
      'geometry',
      'lazy-loading',
    ],
    excerpt:
      'Phase 2 closes. v0.4.0 fills in the last entry point with real implementations of createEllipse, createSector, and createDonut (pure math, zero deps), plus createMilSymbol that lazy-loads milsymbol on first use. Donuts ship with the right-hand-rule winding so the hole actually renders.',
  },
  {
    slug: 'openlayers-overlays',
    title:
      'openlayers v0.3.0: Overlays — Popups, Tooltips, and Dynamic Angular Components on the Map',
    publishedAt: '2026-04-27',
    tags: [
      'openlayers',
      'angular',
      'maps',
      'overlays',
      'popups',
      'tooltips',
      'createcomponent',
      'signals',
    ],
    excerpt:
      'The overlays entry point grows up. v0.3.0 ships <ol-popup> with content projection, [olTooltip] for hover labels, and a real OlPopupService that supports three content modes — string, HTMLElement, and dynamic Angular components via createComponent + hostElement.',
  },
  {
    slug: 'openlayers-interactions-srp',
    title:
      'openlayers v0.2.0: SRP-refactored interactions, Circle draw, and a native-style toolbar',
    publishedAt: '2026-04-27',
    tags: ['openlayers', 'angular', 'maps', 'interactions', 'srp', 'signals'],
    excerpt:
      'The interactions entry point gets a clean Single-Responsibility split into Select / Draw / Modify services, a dedicated InteractionStateService for signal-based state, public types for every config and event, Circle drawing, and a demo toolbar restyled to match the native OpenLayers control aesthetic.',
  },
  {
    slug: 'worker-http-toon-serializer',
    title:
      'worker-http v21.2.0: TOON serializer — 30–60% smaller postMessage payloads for uniform arrays',
    publishedAt: '2026-04-26',
    tags: ['worker-http', 'toon', 'serialization', 'performance', 'angular', 'postMessage'],
    excerpt:
      'Most API responses are uniform arrays of objects, and most of those bytes are repeated keys. We added TOON (Token-Oriented Object Notation) as a first-class serializer for the worker↔main boundary. The auto-serializer now picks it automatically when it makes sense — and falls back to structured-clone or seroval when it does not.',
  },
  {
    slug: 'worker-http-cancellation',
    title: 'worker-http v21.1.0: per-request cancellation with AbortSignal and typed timeouts',
    publishedAt: '2026-04-26',
    tags: ['worker-http', 'cancellation', 'abort-signal', 'angular', 'web-workers'],
    excerpt:
      'v0.7.0 made cancellation work end-to-end internally. v21.1 exposes it: bring your own AbortSignal, override the timeout per request, and branch on a typed WorkerHttpAbortError vs WorkerHttpTimeoutError. No more relying on RxJS unsubscribe to cancel a worker fetch.',
  },
  {
    slug: 'worker-http-v1-0',
    title: 'worker-http v1.0.0: The Journey from Proof-of-Concept to Production',
    publishedAt: '2026-04-25',
    tags: ['worker-http', 'v1.0', 'web-workers', 'angular', 'esbuild', 'schematics', 'safari'],
    excerpt:
      'Five phases, three new entry points, one schematic, and a lot of lessons learned. The complete story of how @angular-helpers/worker-http went from a promising experiment to a production-ready toolkit for off-main-thread HTTP.',
  },
  {
    slug: 'openlayers-phase2',
    title: 'OpenLayers for Angular — Phase 2 Complete',
    publishedAt: '2026-04-24',
    tags: ['openlayers', 'angular', 'maps', 'gis', 'standalone-components'],
    excerpt:
      'A modern Angular wrapper for OpenLayers with standalone components, signals-based reactivity, and modular secondary entry points. Now with interactive controls and full demo.',
  },
  {
    slug: 'worker-http-hardening',
    title:
      'worker-http v0.7.0: hardening — cancellation that actually cancels, real timeouts, and a latent AES bug',
    publishedAt: '2026-04-21',
    tags: ['worker-http', 'bugfix', 'web-workers', 'webcrypto', 'angular'],
    excerpt:
      'A full audit of @angular-helpers/worker-http turned up three bugs hiding in plain sight — cancellation that did not cancel, a requestTimeout option that did nothing, and an AES-CBC/CTR path that threw on every call. Here is what we found, why it happened, and the plumbing fix that makes the package honest.',
  },
  {
    slug: 'security-utilities-expansion',
    title: 'security v21.3: JWT, HIBP, rate limiter, and a two-paradigm forms bridge',
    publishedAt: '2026-04-21',
    tags: [
      'security',
      'angular',
      'signal-forms',
      'reactive-forms',
      'jwt',
      'hibp',
      'csrf',
      'rate-limiter',
    ],
    excerpt:
      'Seven new utilities land in @angular-helpers/security, including a Reactive Forms bridge, a Signal Forms bridge with async HIBP validation, client-side JWT inspection, CSRF helpers, and a verified-auto-clear sensitive clipboard.',
  },
  {
    slug: 'browser-web-apis-v21-11-signal-injection',
    title: 'browser-web-apis v21.11: Signal-based Injection & Composition-First API',
    publishedAt: '2026-04-19',
    tags: ['browser-web-apis', 'signals', 'inject', 'angular', 'v21.11'],
    excerpt:
      'Four new signal-based inject functions bring reactive Battery, Clipboard, Geolocation, and Screen Wake Lock APIs to your components. Plus the new composition-first provider API replaces the legacy flag-bag configuration.',
  },
  {
    slug: 'log-levels-and-experimental-policy',
    title:
      'browser-web-apis v21.11: log levels, experimental policy, and composition-first providers',
    publishedAt: '2026-04-19',
    tags: ['browser-web-apis', 'logging', 'dx', 'angular'],
    excerpt:
      'Global log level control, one-time warnings for experimental APIs, and a composition-first provideBrowserWebApis({ services: [...] }) that replaces the flag-bag config.',
  },
  {
    slug: 'three-new-web-apis-locks-storage-compression',
    title: 'browser-web-apis v21.10: Web Locks, Storage Manager, Compression Streams',
    publishedAt: '2026-04-18',
    tags: ['browser-web-apis', 'web-locks', 'storage', 'compression', 'angular'],
    excerpt:
      'Three new services land: WebLocksService coordinates exclusive access across tabs and workers, StorageManagerService exposes quota estimates and persistence requests, and CompressionService wraps CompressionStream/DecompressionStream for gzip/deflate.',
  },
  {
    slug: 'signal-primitives-for-browser-apis',
    title:
      'browser-web-apis v21.9: signal primitives for clipboard, geolocation, battery, and wake-lock',
    publishedAt: '2026-04-18',
    tags: ['browser-web-apis', 'signals', 'angular'],
    excerpt:
      'Four new inject* primitives complete the signal-first surface for ambient browser state — drop them into a component and read state via signals, with cleanup wired to DestroyRef.',
  },
  {
    slug: 'web-worker-request-response',
    title: 'browser-web-apis v21.8: WebWorker request/response with timeout, signals for status',
    publishedAt: '2026-04-18',
    tags: ['browser-web-apis', 'web-worker', 'signals', 'angular'],
    excerpt:
      'WebWorkerService now ships request/response with id correlation and timeout, exposes status as a signal, and fixes a lifecycle leak where every worker creation registered an additional onDestroy callback.',
  },
  {
    slug: 'web-storage-safari-private-and-unified-api',
    title: 'browser-web-apis v21.7: WebStorage that survives Safari private mode + a unified API',
    publishedAt: '2026-04-18',
    tags: ['browser-web-apis', 'web-storage', 'safari', 'bugfix', 'angular'],
    excerpt:
      'Two changes: every storage access is now wrapped in try/catch (Safari private mode and sandboxed iframes degrade gracefully instead of crashing), and the public API is unified into local and session namespaces sharing one method surface.',
  },
  {
    slug: 'websocket-stateful-client',
    title:
      'browser-web-apis v21.6: stateful WebSocket client with signals, request/response, and a real reconnect',
    publishedAt: '2026-04-18',
    tags: ['browser-web-apis', 'websocket', 'signals', 'bugfix', 'angular'],
    excerpt:
      'We rebuilt the WebSocket service around a stateful client class. State is a signal, reconnect uses exponential backoff with jitter, request/response is built-in via id correlation, and the old reconnect dead-loop bug is gone.',
  },
  {
    slug: 'browser-web-apis-robustness-improvements',
    title:
      'browser-web-apis: robustness deep-dive — spec compliance, leak prevention, and unified architecture',
    publishedAt: '2026-04-13',
    tags: ['browser-web-apis', 'bugfix', 'mdn', 'architecture', 'angular'],
    excerpt:
      'A deep look at what breaks silently in a Browser API wrapper library — from permission pre-checks that block native prompts to WebSocket connections that outlive their host component — and how we fixed it.',
  },
  {
    slug: 'browser-web-apis-v21-5-improvements',
    title: 'browser-web-apis v21.5: real tree-shaking, bug fixes, and signal consistency',
    publishedAt: '2026-04-13',
    tags: ['browser-web-apis', 'tree-shaking', 'angular', 'architecture', 'signals'],
    excerpt:
      'We fixed a double permission check bug, made filter signals truly readonly, unified logging across all services, and restructured providers so each provideX() only pulls in what it needs.',
  },
  {
    slug: 'worker-http-backend-phase3',
    title: 'worker-http v0.3.0: Angular HttpBackend integration — HTTP off the main thread',
    publishedAt: '2026-04-13',
    tags: ['worker-http', 'performance', 'angular', 'web-workers', 'architecture'],
    excerpt:
      "How we replaced Angular's HttpBackend to route HTTP requests through Web Workers — zero API change for the developer, zero cost for the main thread.",
  },
  {
    slug: 'web-redesign-and-library-vision',
    title: 'Redesigning the web & our vision as a library ecosystem',
    publishedAt: '2026-04-12',
    tags: ['meta', 'design', 'architecture', 'angular'],
    excerpt:
      'Why we rebuilt the Angular Helpers website from scratch, the decisions behind the new design system (Tailwind v4 + DaisyUI v5), and the principles that guide every package we ship.',
  },
];
