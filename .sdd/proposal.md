# Proposal: Web Structural Overhaul + DaisyUI + Narrative Alignment

## Intent

The current web app has structural inconsistencies (mixed folder conventions across sections), ad-hoc CSS that is hard to maintain, and a narrative that doesn't clearly communicate the value proposition of `@angular-helpers`. This change resolves all three axes simultaneously: **architecture**, **design system**, and **storytelling**.

## Scope

### In Scope

- **Folder convention**: Every top-level section (`home`, `demo`, `docs`) adopts a canonical structure: `ui/`, `feature/`, `config/`, `models/`, `store/`, `services/`, plus an entry-page at root.
- **Black-box routing**: Each section exposes only its entry component; routing is self-contained inside the section.
- **DaisyUI + Tailwind**: Install and configure Tailwind CSS + DaisyUI so they work together. Migrate all ad-hoc styles to Tailwind/DaisyUI utilities.
- **Custom DaisyUI theme**: Map the existing dark palette (`--bg-base: #0f1117`, accent `#6b8cf2`) to a named DaisyUI theme so the identity is preserved.
- **Global data constants**: Replace magic numbers ("37 services", "3 packages") with a single source-of-truth in `config/` that can be referenced everywhere.
- **Narrative rewrite**: Hero copy, section descriptions, and package cards rewritten to communicate the core promise: _lightweight, Angular-aligned, solving the browser APIs problem developers keep solving from scratch_.
- **Migrate `features/` escape hatch**: Move `src/app/features/docs/*` inside `src/app/docs/feature/`.
- **Fix `shared/` scope**: Components only truly shared across 2+ sections stay in `app/shared/`; section-specific ones move inside the section.

### Out of Scope

- `blog/` section — deferred until narrative strategy is defined.
- `library-services-harness` routing decision — flagged as open question below.
- Library package code changes (bundles, testing tools) — separate concern.
- Bundle size analysis tooling — separate concern.

## Approach

1. Install Tailwind v4 + DaisyUI v5 (CSS-first config, no `tailwind.config.js`).
2. Define a custom DaisyUI theme in `src/styles.css` mapping the existing tokens.
3. Refactor one section at a time (home → docs → demo) to the new folder convention.
4. Replace all ad-hoc CSS classes with Tailwind/DaisyUI utilities.
5. Rewrite copy in `home/config/` and package data.

## Affected Areas

| Area                | Impact       | Description                                                                             |
| ------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `src/app/home/`     | Restructured | Add `ui/`, `feature/`, `config/` subdirs; move `home.config.ts` → `config/home.data.ts` |
| `src/app/docs/`     | Restructured | Absorb `features/docs/*` → `docs/feature/`; align internal structure                    |
| `src/app/demo/`     | Restructured | Apply canonical folder convention per sub-section                                       |
| `src/app/shared/`   | Reduced      | Prune to truly cross-section components only                                            |
| `src/app/features/` | Removed      | Merged into `docs/feature/`                                                             |
| `src/styles.css`    | Modified     | Add Tailwind imports, define DaisyUI custom theme                                       |
| `package.json`      | Modified     | Add `tailwindcss`, `daisyui` dependencies                                               |
| `angular.json`      | Modified     | Add Tailwind CSS build plugin                                                           |

## Risks

| Risk                                          | Likelihood | Mitigation                                       |
| --------------------------------------------- | ---------- | ------------------------------------------------ |
| Tailwind v4 + Angular 21 integration quirks   | Med        | Use `@tailwindcss/vite` plugin; test early       |
| DaisyUI v5 + custom theme override complexity | Low        | DaisyUI v5 supports CSS-variable themes natively |
| Large scope → merge conflicts                 | High       | Work in a dedicated branch, section by section   |
| SSR compatibility with Tailwind               | Low        | Tailwind is pure CSS; no JS runtime concerns     |

## Rollback Plan

Dedicated branch `feat/web-design-overhaul`. If blocked: revert branch, no main impact.

## Decisions (resolved)

1. **DaisyUI + Tailwind**: **Tailwind v4 + DaisyUI v5** — CSS-first config, no `tailwind.config.js`.
2. **Blog section**: **In scope**. First article: "Web redesign & library objectives". Blog section created with canonical structure.
3. **`library-services-harness`**: **Internal demo route** — accessible via URL but not surfaced in the demo nav; more technical, less visual.
4. **Shared components rule**: Component used in ONE section → lives in `<section>/ui/`. Component used in 2+ sections → lives in `shared/` (deduplication goal). Plus a new `core/` folder for global-affecting systems/config (distinct from `shared/`).
5. **Migration strategy**: **Section by section**, each with Playwright tests that verify rendering + DI health + accessibility.
6. **Language**: English-first for all copy. Mobile-first CSS approach. i18n translation system added to `core/i18n/` for future multi-language support.
7. **Testing**: Add web-level Playwright tests per section verifying: content renders, no DI injection errors, AXE accessibility baseline.

## Success Criteria

- [ ] All sections follow the canonical `ui/feature/config/models/store/services/` structure
- [ ] Tailwind + DaisyUI installed and rendering correctly
- [ ] Custom dark theme using existing color palette is applied
- [ ] No ad-hoc global CSS classes remain (except `styles.css` base reset + theme tokens)
- [ ] Home copy clearly communicates the core value proposition
- [ ] Global data constants eliminate magic numbers from templates
- [ ] All Playwright tests pass after migration
- [ ] Lint + format clean
