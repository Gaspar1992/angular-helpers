## Exploration: Add signal-based browser API wrappers

### Current State

The `@angular-helpers/browser-web-apis` package provides custom Angular service wrappers (like `PermissionsService`, `GeolocationService`, etc.) and modern signal-based function wrappers (like `injectPageVisibility`, `injectResizeObserver`, `injectGeolocation`) for web APIs. These signal-based functions are designed to be run in an injection context, use `DestroyRef` for cleanup, leverage `PLATFORM_ID` for SSR safety (avoiding execution of browser APIs during server-side rendering), and wrap real browser-based events into readonly Angular signals. However, common wrappers for responsive design (media query, breakpoints), user preferences (color scheme, reduced motion), interface metrics (mouse position, window scroll), and permissions state are currently missing.

### Affected Areas

- `packages/browser-web-apis/src/public-api.ts` — Export the 8 new inject functions and their associated interfaces/options.
- `packages/browser-web-apis/src/fns/inject-media-query.ts` — Create the new function `injectMediaQuery`.
- `packages/browser-web-apis/src/fns/inject-media-query.spec.ts` — Create tests for `injectMediaQuery`.
- `packages/browser-web-apis/src/fns/inject-breakpoints.ts` — Create `injectBreakpoints` that combines multiple `injectMediaQuery` calls.
- `packages/browser-web-apis/src/fns/inject-breakpoints.spec.ts` — Create tests for `injectBreakpoints`.
- `packages/browser-web-apis/src/fns/inject-preferred-color-scheme.ts` — Create `injectPreferredColorScheme`.
- `packages/browser-web-apis/src/fns/inject-preferred-color-scheme.spec.ts` — Create tests for `injectPreferredColorScheme`.
- `packages/browser-web-apis/src/fns/inject-reduced-motion.ts` — Create `injectReducedMotion` using `injectMediaQuery`.
- `packages/browser-web-apis/src/fns/inject-reduced-motion.spec.ts` — Create tests for `injectReducedMotion`.
- `packages/browser-web-apis/src/fns/inject-document-title.ts` — Create `injectDocumentTitle` which handles updating and optionally restoring document title using effects.
- `packages/browser-web-apis/src/fns/inject-document-title.spec.ts` — Create tests for `injectDocumentTitle`.
- `packages/browser-web-apis/src/fns/inject-mouse-position.ts` — Create `injectMousePosition` tracking client/page/screen mouse coordinates on window.
- `packages/browser-web-apis/src/fns/inject-mouse-position.spec.ts` — Create tests for `injectMousePosition`.
- `packages/browser-web-apis/src/fns/inject-window-scroll.ts` — Create `injectWindowScroll` wrapping scroll position.
- `packages/browser-web-apis/src/fns/inject-window-scroll.spec.ts` — Create tests for `injectWindowScroll`.
- `packages/browser-web-apis/src/fns/inject-permission-state.ts` — Create `injectPermissionState` querying and tracking PermissionStatus changes.
- `packages/browser-web-apis/src/fns/inject-permission-state.spec.ts` — Create tests for `injectPermissionState`.

### Approaches

1. **Monolithic event listeners & independent implementation** — Implement each of the 8 wrappers independently with its own event listener logic inside the function body.
   - Pros: High flexibility for custom options on each utility; no internal coupling between functions.
   - Cons: Code duplication (e.g. media queries, user preferences) leading to higher maintenance cost; harder to ensure consistent SSR/injection-context checking patterns.
   - Effort: Medium

2. **Composite & Shared Primitives** — Build high-level wrappers like `injectBreakpoints`, `injectPreferredColorScheme`, and `injectReducedMotion` directly on top of a single, well-optimized `injectMediaQuery` primitive.
   - Pros: Extremely high reuse, cleaner and DRY codebase, consistent behavior and performance optimizations (like passive scroll listeners), reduced risk of memory leaks.
   - Cons: High-level helpers are coupled to the underlying primitive `injectMediaQuery` (but since they are in the same package and domain, this is standard and highly desirable).
   - Effort: Low

### Recommendation

Approach 2 is recommended. Reusing `injectMediaQuery` for breakpoints, color scheme preference, and reduced motion ensures that media query change event listeners are registered and cleaned up consistently without duplicating setup code. Direct window listeners (scroll, mouse position) will be wrapped safely using `isPlatformBrowser`, `queueMicrotask` for initial microtask alignment, and `DestroyRef` for deterministic event listener teardown.

### Risks

- **SSR/Hydration discrepancies**: If media queries, scroll position, or permission states are evaluated differently on the server (which defaults to false/0/null) and client, it can cause hydration errors if rendering is bound directly to them. To mitigate, we will document that these are client-only indicators, return safe fallback values, and recommend using signals with `@if` or deferred views appropriately.
- **Browser/Environment compatibility**: Some queries (like `permissions.query`) throw on certain browsers (like Firefox for camera/microphone permissions). We must wrap these in `try/catch` and fallback gracefully to `prompt` states.
- **Memory leaks**: Event listeners on `window` and `document` must be carefully unregistered on component/service destruction using `DestroyRef.onDestroy`.

### Ready for Proposal

Yes — The scope of adding these 8 wrappers is well-defined, the technical implementation details are mapped, and we can proceed directly to creating the OpenSpec proposal.
