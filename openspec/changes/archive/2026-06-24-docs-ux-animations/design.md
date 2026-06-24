# Design: Docs UX Animations and Loading States

## Technical Approach

Introduce premium UX improvements across the documentation site. Specifically:

1. **Track search execution states** reactively in [search.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/core/services/search.service.ts) using RxJS operators in a nested pipeline to set a `searching` state.
2. **Render a sliding progress bar** in [search-modal.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/shared/components/search-modal/search-modal.component.ts) that animates custom CSS transitions when `searching()` is active.
3. **Add a responsive search mockup button** to [app-nav.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/shared/nav/app-nav.component.ts) template that matches modern IDE/docsite layouts.
4. **Transition the Core Web Vitals panel** in [vitals-panel.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/vitals-panel.component.ts) by keeping the container in the DOM, applying class bindings, and writing GPU-accelerated CSS transition animations.
5. **Publish a blog post** at `public/content/blog/angular-v22-injection-context-assertions-and-hybrid-workers.md` and index it in [posts.data.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/blog/config/posts.data.ts).

---

## Architecture Decisions

### Decision: Search Service Loading State Pipeline

| Option                                                                            | Tradeoffs                                                                                                                                                                                           | Decision                                                                                                                |
| :-------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Option A (Chosen):** Nested inner-observable pipeline with `tap` and `finalize` | **+** Handles query cancellation/race conditions correctly via `switchMap` teardown.<br>**+** Centralized logic inside the service.<br>**-** Requires nested `of(null)` mapping to defer execution. | **Chosen.** Ensures `searching` is always accurate, even if search queries are canceled or thrown due to workers error. |
| **Option B:** Component-based state toggle                                        | **+** Simpler syntax.<br>**-** Prone to state mismatch if queries overlap, are cancelled, or fail off-thread.                                                                                       | **Rejected.** Fails to enforce a single source of truth.                                                                |

### Decision: Vitals Panel Transition Strategy

| Option                                                                  | Tradeoffs                                                                                                                                                                                                                             | Decision                                                     |
| :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------- |
| **Option A (Chosen):** CSS Transition + Class Binding + DOM Persistence | **+** Performance (native GPU-acceleration via transform/opacity).<br>**+** Supports exit animations.<br>**+** Accessible using `visibility: hidden` and `pointer-events: none` when closed.<br>**-** Lightweight div remains in DOM. | **Chosen.** Clean, fast, zero-dependency visual transitions. |
| **Option B:** `@angular/animations`                                     | **+** Standard Angular structural directive mapping.<br>**-** Heavy bundle overhead for a single simple transition.                                                                                                                   | **Rejected.** Over-engineered for a simple visual effect.    |

---

## Data Flow

```
[User Type Input] ──→ SearchService.query (Signal)
                            │
                            ▼ (toObservable)
                       Query (Observable)
                            │
                            ▼ (switchMap)
                       [Inner Pipeline]
                            ├─► tap() ──→ Set searching = true
                            ├─► execute worker 'search'
                            ├─► catchError()
                            └─► finalize() ──→ Set searching = false
                            │
                            ▼
                       results (Signal) ──→ SearchModalComponent (renders .search-progress-bar)
```

---

## File Changes

| File                                                                                                                                               | Action | Description                                                                                                                 |
| :------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------- |
| [search.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/core/services/search.service.ts)                                  | Modify | Add `searching` signal. Integrate `tap` and `finalize` inside a nested query pipeline.                                      |
| [search-modal.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/shared/components/search-modal/search-modal.component.ts) | Modify | Apply `relative` position to input container. Display progress bar conditional on `searching()`. Add CSS loading animation. |
| [app-nav.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/shared/nav/app-nav.component.ts)                               | Modify | Inject `SearchService`. Add responsive markup for a search trigger button mockup.                                           |
| [vitals-panel.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/docs/layout/vitals-panel.component.ts)                    | Modify | Replace `@if` structural block with `[class.expanded]` binding. Update CSS with slide/fade cubic-bezier transitions.        |
| [posts.data.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/blog/config/posts.data.ts)                                            | Modify | Index new blog post at index `0` of the `BLOG_POSTS` list.                                                                  |
| `public/content/blog/angular-v22-injection-context-assertions-and-hybrid-workers.md`                                                               | Create | New blog post markdown file detailing the latest upgrades.                                                                  |

---

## Interfaces / Contracts

### 1. CSS Keyframe Animation: `.search-progress-bar`

```css
.search-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--c-primary) 25%,
    var(--c-accent) 50%,
    var(--c-secondary) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: search-glow 1.5s infinite linear;
  box-shadow: 0 0 8px var(--c-primary);
}

@keyframes search-glow {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### 2. Vitals Panel Transition Properties

```css
.vitals-content {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
  pointer-events: none;
  visibility: hidden;
  transition:
    opacity 200ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
    visibility 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.vitals-content.expanded {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
  visibility: visible;
}
```

### 3. Blog Post Entry

```typescript
{
  slug: 'angular-v22-injection-context-assertions-and-hybrid-workers',
  title: 'Angular v22: Injection Context Assertions and Hybrid Worker Orchestration',
  publishedAt: '2026-06-24',
  tags: ['angular', 'v22', 'injection-context', 'web-workers', 'performance', 'ux'],
  excerpt:
    'Explore the architectural upgrades in Angular v22! We detail the implementation of robust injection context assertions, dynamic hybrid worker executor fallbacks, smooth Core Web Vitals transition panels, and real-time worker search modal progress indicators.',
}
```

---

## Testing Strategy

| Layer    | What to Test                              | Approach                                                                                                                     |
| :------- | :---------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Unit** | `SearchService` state lifecycle           | Test that `searching` signal toggles to `true` when query changes and toggles to `false` when execution terminates/resolves. |
| **Unit** | `SearchModalComponent` element visibility | Verify `#vitals-panel-content` rendering state. Assert presence of CSS classes instead of direct DOM elements absence.       |
| **Unit** | `AppNavComponent` trigger                 | Ensure clicking the navigation search mockup triggers `SearchService.open()`.                                                |

---

## Migration / Rollout

No breaking changes. This is backward-compatible visual polishing.

---

## Open Questions

None.
