---
title: Redesigning the web & our vision as a library ecosystem
publishedAt: 2026-04-12
tags: [meta, design, architecture, angular]
excerpt: Why we rebuilt the Angular Helpers website from scratch, the decisions behind the new design system (Tailwind v4 + DaisyUI v5), and the principles that guide every package we ship.
---

We rebuilt the Angular Helpers website from scratch. Not because the old one was broken, but because it had grown in ways that made it hard to change — inconsistent folder structures, ad-hoc CSS that only the author understood, and a narrative that didn't actually explain _why_ you'd want to use these libraries.

This article explains what we changed, why, and the principles behind it.

## The problem we were solving

Every Angular application we've worked on has the same pattern: early in the project someone writes a `GeolocationService`. Then someone else writes a `ClipboardService`. Then a `WebSocketService`. Each one is slightly different, each one has slightly different lifecycle handling, and none of them have been tested in a real browser.

The browser platform has gotten incredibly capable. Web APIs that used to require native apps — camera access, Bluetooth, NFC, payments, file system access — are now available from JavaScript. But nobody ships a well-typed, lifecycle-aware Angular service for them. You write your own, every time.

That's the gap **@angular-helpers** fills. We solved it once, properly, and made it tree-shakable so you only pay for what you use.

## What each package stands for

### browser-web-apis — Lightweight. Standard.

37 typed Angular services. One provider function. Every service respects permissions, handles secure-context requirements, cleans up with `DestroyRef`, and exposes its state as Angular signals. If a browser API exists and is worth wrapping, it's in here.

The promise is **lightweight and standard**: we follow the Web API spec closely, add no unnecessary abstraction, and keep the bundle impact minimal.

### security — Robust. Safe.

ReDoS is a real vulnerability. A catastrophically backtracking regex can lock your main thread for seconds. `@angular-helpers/security` runs regex evaluation in a Web Worker with a configurable timeout — the main thread is never blocked.

Beyond regex, the package includes WebCrypto utilities (AES-GCM, HMAC), encrypted localStorage/sessionStorage, XSS-safe input sanitization, and entropy-based password strength scoring.

### worker-http — Performance. Off-main-thread.

HTTP requests block the main thread. Not a lot, but measurably. `@angular-helpers/worker-http` moves your HTTP calls into a Web Worker with a typed RPC bridge. You call the same familiar API, the work happens off-thread, and your UI stays responsive.

It ships with 7 built-in interceptors: retry, cache, HMAC signing, rate limiting, and more.

## Technical decisions in this rebuild

### Tailwind v4 + DaisyUI v5

We dropped all ad-hoc CSS and moved to Tailwind v4 (CSS-first, no config file) with DaisyUI v5 for component primitives. The existing dark color palette was mapped to a custom DaisyUI theme named `angular-helpers`, so the visual identity is preserved but now backed by a proper design system.

Mobile-first throughout. The old site had several desktop-first overrides that made narrow viewports feel like an afterthought.

### Canonical section structure

Every top-level section of the app (`home/`, `demo/`, `docs/`, `blog/`) now follows the same internal convention:

```
section/
├── section.component.ts   ← entry page
├── section.routes.ts      ← self-contained routing
├── ui/                    ← presentational components
├── feature/               ← smart components
├── config/                ← constants & data
├── models/                ← TypeScript interfaces
├── store/                 ← signals (if needed)
└── services/              ← section-scoped DI
```

The goal is that each section is a black box. You import the entry component, it adds its own routing. No leaking internals.

### Templates + Resolvers — components are receivers, not fetchers

The biggest structural principle in this rebuild is that **route components don't fetch their own data**. Instead:

1. The route defines a **resolver** that fetches/constructs the data
2. The **component** receives it via `ActivatedRoute.data` and renders it
3. The same component can render entirely different content depending on what the resolver provides

This is already in place for the docs section — `UnifiedOverviewComponent` and `UnifiedServiceDetailComponent` are pure templates. The resolver decides what config they receive. Three different npm packages share one overview template and one service-detail template.

The blog section follows the same pattern: articles are `.md` files stored in `public/content/blog/`. The `BlogPostResolver` fetches the file, parses the frontmatter and renders the markdown to HTML, then passes a `BlogPostData` object to the route. `BlogPostComponent` receives it and renders the template.

### shared/ vs core/ separation

`shared/` is now strictly a deduplication boundary: components used in two or more sections live here. Single-section code lives inside the section.

`core/` is new: global systems that affect the entire app — i18n translations, navigation data, app-wide constants. Not UI components.

### Blog as Markdown — easy to read in the repo

Blog articles live as plain `.md` files. Anyone who visits the GitHub repository can read them directly without rendering. The `README.md` links to articles that are relevant to the library's evolution.

Each article has YAML frontmatter (title, date, tags, excerpt) that drives both the list page and the article header. Adding a new article means:

1. Create `public/content/blog/your-slug.md` with frontmatter
2. Add an entry to `src/app/blog/config/posts.data.ts`
3. Done — the resolver and template handle the rest

### i18n from day one

The site is English-first, but all UI copy is sourced from `core/i18n/en.ts`. Adding a second language means adding a new file and wiring it into the signal-based `I18nService`. No template strings need to change.

## What comes next

The docs section will get the same Tailwind treatment. Then we'll add bundle size tracking — we want to make the "lightweight" claim verifiable with real numbers.

And we'll keep shipping browser API services. If there's a Web API you're wrapping by hand in every Angular project, [open an issue](https://github.com/Gaspar1992/angular-helpers/issues).
