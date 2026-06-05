## Implementation Tasks: Angular 22 Refactor

- [x] Task 1.1: In `packages/openlayers/controls/src/features/geolocation-control.component.ts`, replace `@ViewChild('controlElement')` with `viewChild.required('controlElement')` and remove the `@ViewChild` import if no longer used.
- [x] Task 1.2: In `packages/testing/src/mock-component.ts`, remove `standalone: true` from the `@Component` dynamic decorator options.
- [x] Task 1.3: In `packages/testing/src/mock-pipe.ts`, remove `standalone: true` from the `@Pipe` dynamic decorator options.
- [x] Task 1.4: Remove `standalone: true` in `packages/testing/src/render.spec.ts` if it exists.
- [x] Task 1.5: Remove `standalone: true` in `packages/testing/src/render.ts` if it exists.
- [x] Task 1.6: Remove `standalone: true` in `packages/testing/src/signal-testing.spec.ts` if it exists.
