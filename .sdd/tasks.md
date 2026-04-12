# Tasks: Web Structural Overhaul + DaisyUI + Narrative Alignment

Branch: `feat/web-design-overhaul`

---

## Phase 0 — Foundation (unblocks everything else)

- [ ] **T-01** Create branch `feat/web-design-overhaul`
- [ ] **T-02** Install `tailwindcss@^4`, `daisyui@^5`, `@tailwindcss/vite`
- [ ] **T-03** Register `@tailwindcss/vite` in `vite.config.ts`
- [ ] **T-04** Add `@import "tailwindcss"` + `@plugin "daisyui"` to top of `styles.css`
- [ ] **T-05** Define `angular-helpers` DaisyUI theme in `styles.css`
- [ ] **T-06** Add `data-theme="angular-helpers"` to `<html>` in `index.html`
- [ ] **T-07** Verify Tailwind + DaisyUI tokens resolve in browser (smoke test)
- [ ] **T-08** Create `src/app/core/` folder structure:
  - `core/config/app.constants.ts`
  - `core/config/packages.data.ts` (migrate from `home.config.ts`)
  - `core/config/nav.data.ts`
  - `core/i18n/en.ts`
  - `core/i18n/i18n.service.ts`
  - `core/i18n/i18n.token.ts`
- [ ] **T-09** Add `@axe-core/playwright` to devDependencies (for web accessibility tests)

---

## Phase 1 — Home Section

- [ ] **T-10** Create canonical folder structure in `home/`:
  - `home/ui/` — move `feature-card`, `package-card`, `stats-bar` from `shared/components/`
  - `home/config/home.config.ts` — re-export from `core/config/` + home-specific arrays
  - `home/models/` — move any home-specific models
- [ ] **T-11** Migrate `home.component.ts` template to Tailwind + DaisyUI utilities
- [ ] **T-12** Migrate `feature-card` component to Tailwind (delete `.component.css`)
- [ ] **T-13** Migrate `package-card` component to Tailwind (delete `.component.css`)
- [ ] **T-14** Migrate `stats-bar` component to Tailwind (delete `.component.css`)
- [ ] **T-15** Rewrite home hero copy (REQ-N-01)
- [ ] **T-16** Update `HOME_STATS` to derive service count from `packages.data.ts`
- [ ] **T-17** Delete `home.component.css`
- [ ] **T-18** Write `test/web/home.spec.ts`:
  - Hero heading visible
  - CTA buttons ("Get started", "Live demo") present
  - Package cards (3) render
  - Stats bar renders
  - Nav links work
  - No console errors on load
  - AXE scan: zero critical/serious

---

## Phase 2 — Shared Cleanup

- [ ] **T-19** Confirm `code-window` used in home + docs → keep in `shared/components/`
- [ ] **T-20** Confirm `site-footer` used across sections → keep in `shared/components/`
- [ ] **T-21** Migrate `code-window` to Tailwind (delete `.component.css`)
- [ ] **T-22** Migrate `site-footer` to Tailwind (delete `.component.css`)
- [ ] **T-23** Create `shared/components/site-nav/` if nav is not yet a component, extract from layouts
- [ ] **T-24** Remove any models from `shared/models/` that moved to section or `core/`

---

## Phase 3 — Docs Section

- [ ] **T-25** Create canonical structure in `docs/`:
  - `docs/ui/` — docs-specific presentational components
  - `docs/feature/` — absorb `src/app/features/docs/unified-overview/` and `unified-service-detail/`
  - `docs/config/` — docs landing data
  - `docs/models/` — move from `docs/models/`
  - `docs/services/` — move `docs/resolvers/` (rename to services)
- [ ] **T-26** Update `docs/docs.routes.ts` imports to new paths
- [ ] **T-27** Delete `src/app/features/` directory (empty after T-25)
- [ ] **T-28** Migrate `docs-layout.component` to Tailwind
- [ ] **T-29** Migrate `docs-landing.component` to Tailwind
- [ ] **T-30** Remove docs-specific CSS from `styles.css` (`.docs-*` classes) — replaced by Tailwind
- [ ] **T-31** Write `test/web/docs.spec.ts`:
  - Docs landing heading visible
  - Package nav links (browser-web-apis, security, worker-http) present
  - No 404 on `/docs/browser-web-apis`, `/docs/security`, `/docs/worker-http`
  - No console errors
  - AXE scan: zero critical/serious

---

## Phase 4 — Demo Section

- [ ] **T-32** Create canonical structure in `demo/`:
  - `demo/ui/` — demo layout components
  - `demo/config/demo.config.ts` — demo nav items (public only)
  - `demo/models/`
- [ ] **T-33** Apply canonical structure to `demo/security/`:
  - `demo/security/ui/`
  - `demo/security/config/`
- [ ] **T-34** Apply canonical structure to `demo/browser-apis/`
- [ ] **T-35** Apply canonical structure to `demo/worker-http/`
- [ ] **T-36** Add visible internal note to `library-services-harness` component
- [ ] **T-37** Confirm `library-services` route is NOT in demo nav config
- [ ] **T-38** Migrate `demo-layout.component` to Tailwind
- [ ] **T-39** Migrate `demo-home.component` to Tailwind
- [ ] **T-40** Write `test/web/demo.spec.ts`:
  - Demo home renders with visible section links
  - `library-services` link NOT in nav
  - `/demo/library-services` accessible by direct URL
  - Internal harness note visible on that page
  - No console errors
  - AXE scan

---

## Phase 5 — Blog Section (New)

- [ ] **T-41** Create `src/app/blog/` with canonical structure
- [ ] **T-42** Create `blog/models/blog-post.model.ts`
- [ ] **T-43** Create `blog/config/posts.data.ts` with first post entry
- [ ] **T-44** Create `blog/blog.component.ts` (list page) — mobile-first, Tailwind
- [ ] **T-45** Create `blog/feature/blog-post/blog-post.component.ts` (article detail)
- [ ] **T-46** Create `blog/blog.routes.ts`
- [ ] **T-47** Add `/blog` route to `app.routes.ts`
- [ ] **T-48** Write first article content: `web-redesign-and-library-vision`
- [ ] **T-49** Add blog link to `site-nav`
- [ ] **T-50** Write `test/web/blog.spec.ts`:
  - Blog list page renders
  - First article link visible
  - Article page renders with correct heading
  - No console errors
  - AXE scan

---

## Phase 6 — Final Cleanup & Verification

- [ ] **T-51** Remove remaining `--sp-*`, `--border`, `--accent` CSS vars from `styles.css` (confirm nothing references them)
- [ ] **T-52** Verify no `.component.css` files have non-empty content
- [ ] **T-53** Run full Playwright suite: `npm run test:browser:ci`
- [ ] **T-54** Run `npm run lint` — zero errors
- [ ] **T-55** Run `npm run format:check` — clean
- [ ] **T-56** Review all AC-01 through AC-12 from spec.md
- [ ] **T-57** Open PR with description linking to `.sdd/proposal.md` and blog article intent
