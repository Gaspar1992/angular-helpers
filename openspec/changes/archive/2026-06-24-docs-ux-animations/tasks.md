# Tasks: Docs UX Animations and Loading States

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | 100–150     |
| 400-line budget risk    | Low         |
| Chained PRs recommended | No          |
| Suggested split         | Single PR   |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | pending     |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                                              | Likely PR | Notes                                                                 |
| ---- | ----------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| 1    | Search Service, Modal, Navigation Header, Vitals Panel, Blog Post | PR 1      | Single PR — 5 modified files + 1 new file, well under 400-line budget |

## Phase 1: Search Service & Modal

- [ ] 1.1 Update `src/app/core/services/search.service.ts` — Add `searching` signal and RxJS pipeline update inside query pipeline using `tap` and `finalize`.
- [ ] 1.2 Update `src/app/shared/components/search-modal/search-modal.component.ts` — Update template and styles to render `.search-progress-bar` under the search input conditional on `searching()`.

## Phase 2: App Navigation & Vitals Panel

- [ ] 2.1 Update `src/app/shared/nav/app-nav.component.ts` — Add mockup search button trigger layout, styling, and configure click handler to call `SearchService.open()`.
- [ ] 2.2 Update `src/app/docs/layout/vitals-panel.component.ts` — Replace `@if` structural flow with persistent HTML element using `[class.expanded]="expanded()"` binding and add GPU-accelerated CSS transitions for scale, transform, opacity, and visibility.

## Phase 3: Blog Post Content

- [ ] 3.1 Create `public/content/blog/angular-v22-injection-context-assertions-and-hybrid-workers.md` — Write blog post documenting injection context assertions, hybrid worker orchestrator, floating vitals-panel, search-modal and animations.
- [ ] 3.2 Update `src/app/blog/config/posts.data.ts` — Register the new blog post entry at index 0 of `BLOG_POSTS`.

## Phase 4: Testing & Verification

- [ ] 4.1 Update unit tests in `src/app/core/services/search.service.spec.ts` to verify the `searching` signal behavior when query changes.
- [ ] 4.2 Verify existing specs pass and styling guidelines are respected.
- [ ] 4.3 Run `pnpm test` and `pnpm lint` to verify correct formatting and correctness.
