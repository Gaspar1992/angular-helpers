# Proposal: Docs UX Animations and Loading States

## Intent

Enhance the user experience of the documentation site by providing visual polish, including search progress indications, an accessible navigation header search trigger, smooth CSS transition effects for the floating Core Web Vitals performance panel, and publishing a blog post documenting recent Angular v22 upgrades.

## Scope

### In Scope

- **Search Loading State & Progress Bar**:
  - Add a `searching = signal(false)` state to `SearchService`.
  - Update the `results` pipeline in `SearchService` using RxJS side-effects (`tap` and `finalize`) inside worker execution to reflect active search worker state.
  - Implement a thin, infinitely-sliding glowing progress bar below the search input in `SearchModalComponent` that renders when `searching()` is `true`.
- **Search Navigation Trigger Button**:
  - Add a beautiful search trigger mockup button/input in `AppNavComponent` template with a magnifying glass icon and shortcut indicator `Ctrl+K` (or `⌘K`).
  - Clicking this mockup triggers `SearchService.open()`.
- **Vitals Panel Smooth Transitions**:
  - Refactor `VitalsPanelComponent` metrics container to be persistently rendered in the DOM, using a class binding `[class.expanded]="expanded()"` instead of conditional `@if`.
  - Add CSS transitions with translation, scale, and opacity rules over a 200ms cubic-bezier transition.
- **Blog Post**:
  - Add a new blog post markdown file at `public/content/blog/angular-v22-injection-context-assertions-and-hybrid-workers.md` and register it in `src/app/blog/config/posts.data.ts`.

### Out of Scope

- Modifying search indexing logic or changing worker search performance.
- Adding real search keyboard input directly in the navigation header (which will act purely as a modal trigger).
- Modifying underlying Core Web Vitals metric observation logic.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- None (this is purely visual/UX adjustments and blog content, no changes to core functional specs).

## Approach

1. **Search Service Integration**:
   - Declare a `searching = signal(false)` property in `SearchService`.
   - Update the `results` pipeline to set `searching` to `true` before `pool.execute` begins, and use `finalize` on the execution observable stream to set `searching` to `false` when execution terminates (on success, cancellation, or error).
2. **Search Progress Bar UI**:
   - Insert a container `div` below the input in `SearchModalComponent`.
   - Style the progress bar to animate with a sliding gradient (`var(--c-primary)`, `var(--c-accent)`, `var(--c-secondary)`) using CSS animations (`keyframes`).
3. **App Nav Search Button mockup**:
   - Update `AppNavComponent` template to place a mockup input/button between the logo/brand and navigation items.
   - Display a magnifying glass icon, keyboard shortcut hints, and configure click handler to call `SearchService.open()`.
4. **Vitals Panel CSS Transition**:
   - Change `VitalsPanelComponent` template: replace `@if (expanded())` with a persistent element having `[class.expanded]="expanded()"`.
   - Use CSS classes to control the opacity (`0` to `1`), transform (`translateY(12px) scale(0.95)` to `translateY(0) scale(1)`), pointer-events, and visibility.
   - Apply a `200ms cubic-bezier(0.4, 0, 0.2, 1)` transition for these properties.
5. **Blog Post Content**:
   - Create `angular-v22-injection-context-assertions-and-hybrid-workers.md` to document:
     - Injection context assertions in storage utilities.
     - Hybrid worker orchestration (robust fallback executor strategy).
     - Floating Core Web Vitals panel with smooth transitions.
     - Search modal worker search progress indicators.
   - Add metadata entry inside `src/app/blog/config/posts.data.ts`.

## Affected Areas

| Area                                                                                 | Impact   | Description                                                    |
| ------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------- |
| `src/app/core/services/search.service.ts`                                            | Modified | Add `searching` signal state and manage it in the RxJS stream. |
| `src/app/shared/components/search-modal/search-modal.component.ts`                   | Modified | Render sliding progress bar below the input.                   |
| `src/app/shared/nav/app-nav.component.ts`                                            | Modified | Add the search trigger mockup with icon and shortcut.          |
| `src/app/docs/layout/vitals-panel.component.ts`                                      | Modified | Replace `@if` logic with class binding and CSS transitions.    |
| `public/content/blog/angular-v22-injection-context-assertions-and-hybrid-workers.md` | New      | New blog post documenting recent upgrades.                     |
| `src/app/blog/config/posts.data.ts`                                                  | Modified | Register the new blog post entry.                              |

## Risks

| Risk                              | Likelihood | Mitigation                                                                                                                     |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Unit tests check DOM immediately  | Medium     | Keep elements in the DOM and toggle `visibility` and `pointer-events` (accessibility-friendly and Vitest selector compatible). |
| Hanging worker / infinite loading | Low        | Ensure the RxJS `finalize` block always runs to reset `searching` to false upon stream termination.                            |

## Rollback Plan

Revert all changes using git checkout and delete the newly created blog post file:

```bash
git checkout HEAD -- src/app/core/services/search.service.ts src/app/shared/components/search-modal/search-modal.component.ts src/app/shared/nav/app-nav.component.ts src/app/docs/layout/vitals-panel.component.ts src/app/blog/config/posts.data.ts
rm public/content/blog/angular-v22-injection-context-assertions-and-hybrid-workers.md
```

## Dependencies

- None

## Success Criteria

- [ ] `SearchService` exposes a `searching` signal tracking the active state of worker executions.
- [ ] `SearchModalComponent` shows a thin, sliding glowing progress bar below the input when `searching()` is `true`.
- [ ] `AppNavComponent` contains a search trigger input mockup containing a magnifying glass icon and 'Ctrl+K' (or '⌘K') shortcut hint that calls `SearchService.open()`.
- [ ] `VitalsPanelComponent` metric content transitions smoothly using scale, translate, and opacity transitions with a 200ms cubic-bezier timing function when expanded/collapsed.
- [ ] A new blog post at `public/content/blog/angular-v22-injection-context-assertions-and-hybrid-workers.md` exists and covers injection context assertions, hybrid workers, vitals-panel, search-modal, and animations.
- [ ] All unit tests pass successfully.
