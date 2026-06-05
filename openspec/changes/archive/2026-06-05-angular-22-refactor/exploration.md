## Exploration: Angular 22 improvements for packages/

### Current State

The `packages/` directory contains libraries (`browser-web-apis`, `core`, `openlayers`, `security`, `storage`, `testing`, `worker-http`) that have largely already been migrated to modern Angular features. The codebase correctly uses `input()`, `output()`, and signals. It has removed legacy control flow (`*ngIf`, etc.) and `mutate()` calls on signals, and it relies on `standalone` being the default in Angular 19+. The codebase is highly optimized and almost fully aligns with Angular 22 standards.

### Affected Areas

- `packages/openlayers/controls/src/features/geolocation-control.component.ts` — Still uses `@ViewChild('controlElement')` decorator instead of the modern `viewChild.required()`.
- `packages/testing/src/mock-component.ts` — Contains `standalone: true` in the `@Component` dynamic decorator options. This is now redundant since Angular 19+ defaults to true.
- `packages/testing/src/mock-pipe.ts` — Contains `standalone: true` in the `@Pipe` dynamic decorator options, which is also redundant.
- `packages/testing/src/render.spec.ts`
- `packages/testing/src/render.ts`
- `packages/testing/src/signal-testing.spec.ts`
  - The testing utilities and specs still specify `standalone: true` which can be safely omitted.

### Approaches

1. **Targeted Decorator/Flag Removal** — Update `geolocation-control.component.ts` to use `viewChild.required()` and remove `standalone: true` from all `testing` utilities and tests.
   - Pros: Cleans up the last remaining legacy decorators/flags; fully aligns with Angular 22 defaults without disrupting existing logic.
   - Cons: Trivial effort, but touches testing utilities which may affect dependent tests if any consumers are using older Angular versions (assuming monorepo uses Angular 19+).
   - Effort: Low

### Recommendation

**Targeted Decorator/Flag Removal**. The codebase is already in excellent shape regarding Angular 22 changes. The only remaining tasks are cleaning up a single `@ViewChild` usage in `geolocation-control.component.ts` and stripping `standalone: true` from the `testing` package helpers.

### Risks

- If any consuming app of the `testing` library is on Angular < 19, removing `standalone: true` from `mock-component.ts` or `mock-pipe.ts` would cause them to default to `false` and break. Assuming the monorepo requires Angular 19/22, this is safe.

### Ready for Proposal

Yes — The orchestrator should proceed with applying these minor refactoring steps since they are well understood and isolated.
