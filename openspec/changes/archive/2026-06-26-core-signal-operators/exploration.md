## Exploration: core-signal-operators

### Current State

Currently, `@angular-helpers` does not provide generic reactive signal utilities. `@angular-helpers/browser-web-apis` provides feature-specific reactive functions (e.g., `injectPageVisibility`, `injectResizeObserver`), but there are no general-purpose timing or filtering operators like debounce, throttle, or timer. Developers must either use RxJS interoperability (`toObservable` and `toSignal`) manually or implement custom debouncing/throttling.

### Affected Areas

- `packages/core/src/public-api.ts` — to export the new signal utility functions.
- `packages/core/src/signals/` — new directory to house the implementations (`debounced-signal.ts`, `throttled-signal.ts`, `timer-signal.ts`, `index.ts`).
- `packages/core/README.md` — to document the new operators (if README exists, or create one).
- `README.md` (root) — to add brief details about the new core signal operators.

### Approaches

1. **Pure Signal-Native (Custom Timing Logic)** — Implement debouncing and throttling natively using Angular `effect` (or `watch` under the hood) and standard `setTimeout` / `setInterval` wrapped in browser platform checks.
   - Pros:
     - No dependency on RxJS `toObservable` and `toSignal` interoperability.
     - Minimal overhead, avoiding the creation of intermediate RxJS Observables.
     - Easy to control the initial/immediate value emission without queueing microtasks.
   - Cons:
     - Requires custom debounce/throttle timing logic, which can be prone to edge cases (e.g., handling rapid value changes or parameter changes).
   - Effort: Medium

2. **RxJS-Interoperability Wrapper** — Implement the operators by converting the source signal to an Observable using `toObservable`, applying the corresponding RxJS operator (`debounceTime`, `throttleTime`, `timer`), and converting it back to a Signal using `toSignal`.
   - Pros:
     - Extremely clean and short implementation (RxJS handles all edge cases, scheduling, leading/trailing flags).
     - Standardizes on Angular's own official interoperability package.
   - Cons:
     - Heavy performance overhead: converts Signal -> Observable -> Signal for simple reactive flows.
     - `toSignal` requires an injection context and behaves asynchronously, making synchronous initial assertions in tests harder to verify.
     - Relies on RxJS's asynchronous scheduler which can cause timing issues in tight update loops.
   - Effort: Low

### Recommendation

**Approach 1 (Pure Signal-Native)** is recommended.
Using native signals avoids the overhead of converting back and forth to RxJS observables. It keeps the bundle size small, runs synchronously during initial creation, and provides precise control over SSR behavior (by bypassing timer registration altogether on the server). By leveraging `injectPlatform()`, we can guarantee that no macro-tasks (timeouts/intervals) are scheduled on the server, avoiding SSR stabilization blocking.

### Risks

- **SSR Stabilisation Blockers**: If timers are not strictly checked via `isPlatformBrowser`, Node.js will keep the event loop open, blocking Angular from rendering and returning the HTML.
- **Memory Leaks**: If timers are not correctly cleared when a component is destroyed, it will lead to memory leaks. Using `DestroyRef` is critical.
- **Injection Context Errors**: If operators are called inside callback functions (outside class initialization / constructor), they will throw `NG0203: inject() must be run in an injection context`. The API must allow passing an explicit `Injector` to handle these scenarios gracefully.

### Ready for Proposal

Yes. The requirements and design constraints are well-defined. The next step is to create the formal proposal specifying the exact API signatures and behavior.
