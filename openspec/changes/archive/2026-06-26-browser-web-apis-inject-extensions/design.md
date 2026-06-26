# Design: Browser Web APIs Extensions

## Technical Approach

Implement 8 new standalone utility functions using Angular signals, `DestroyRef`, and `PLATFORM_ID` for SSR safety. We will optimize reuse by layering `injectBreakpoints`, `injectPreferredColorScheme`, and `injectReducedMotion` directly on top of `injectMediaQuery`. Event-driven wrappers (`injectMousePosition`, `injectWindowScroll`) will use passive window event listeners to avoid blocking main thread execution. `injectPermissionState` will catch permission query failures to remain compatible with Firefox.

## Architecture Decisions

| Option                         | Tradeoff                                                                    | Decision                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Independent Listeners**      | Clean separation but leads to code duplication across media-query wrappers. | **Rejected**: Layering on top of `injectMediaQuery` is DRY and guarantees consistent behavior. |
| **Direct window listeners**    | Simple to implement but can cause scroll/move performance degradation.      | **Rejected**: All high-frequency event listeners will use `{ passive: true }`.                 |
| **Strict Permission Erroring** | Throws on Firefox for camera/microphone permissions.                        | **Rejected**: Catch `TypeError` in Firefox and return a synthetic `'prompt'` state.            |

## File Changes

| File                                                                                                                                                        | Action | Description                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| [public-api.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/public-api.ts)                                           | Modify | Export the 8 new functions and associated interfaces/options.                      |
| [inject-media-query.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-media-query.ts)                       | Create | Implement `injectMediaQuery` with change listeners and DestroyRef teardown.        |
| [inject-breakpoints.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-breakpoints.ts)                       | Create | Implement `injectBreakpoints` mapping a record of queries to signals.              |
| [inject-preferred-color-scheme.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-preferred-color-scheme.ts) | Create | Implement `injectPreferredColorScheme` by querying `(prefers-color-scheme: dark)`. |
| [inject-reduced-motion.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-reduced-motion.ts)                 | Create | Implement `injectReducedMotion` by querying `(prefers-reduced-motion: reduce)`.    |
| [inject-document-title.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-document-title.ts)                 | Create | Implement `injectDocumentTitle` syncing title via effect and restoring on destroy. |
| [inject-mouse-position.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-mouse-position.ts)                 | Create | Implement `injectMousePosition` tracking mouse coordinates with passive listener.  |
| [inject-window-scroll.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-window-scroll.ts)                   | Create | Implement `injectWindowScroll` tracking scroll offset with passive listener.       |
| [inject-permission-state.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-permission-state.ts)             | Create | Implement `injectPermissionState` tracking PermissionStatus state reactively.      |
| `packages/browser-web-apis/src/fns/*.spec.ts`                                                                                                               | Create | Create Vitest test files for each helper function validating behavior.             |

## Interfaces / Contracts

```typescript
export interface DocumentTitleOptions {
  restoreOnDestroy?: boolean;
}

export interface DocumentTitleRef {
  readonly title: WritableSignal<string>;
}

export interface MousePosition {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
}

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface PermissionStateRef {
  readonly state: Signal<PermissionState | 'unsupported' | 'loading'>;
  readonly isSupported: Signal<boolean>;
}
```

## Testing Strategy

| Layer | What to Test             | Approach                                                                                              |
| ----- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Unit  | Context Enforcement      | Verify each function throws when invoked outside an injection context.                                |
| Unit  | SSR Safety               | Set `PLATFORM_ID` to `'server'` and verify safe default/fallback signals.                             |
| Unit  | mediaQuery / preferences | Mock `window.matchMedia` and trigger change events; verify signal updates and cleanup.                |
| Unit  | Document Title           | Check title synchronization and original title restoration upon injector destruction.                 |
| Unit  | Event Listeners          | Spy on `window.addEventListener` to confirm `{ passive: true }` options and listener removal.         |
| Unit  | Permissions (Firefox)    | Mock `navigator.permissions.query` throwing a `TypeError` and verify graceful fallback to `'prompt'`. |

## Migration / Rollout

No migration required. This change introduces non-breaking, optional utility functions.

## Open Questions

None.
