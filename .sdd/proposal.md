# Proposal: Security Utilities Expansion

**Branch**: `feat/security-utilities-expansion`
**Target package**: `@angular-helpers/security`
**Version bump**: minor (`21.2.0` → `21.3.0`)
**Status**: Draft — awaiting approval

---

## Problem

`@angular-helpers/security` currently ships solid **cryptographic primitives** (`WebCryptoService`, `SecureStorageService`) and a few **analysis services** (`RegexSecurityService`, `InputSanitizerService`, `PasswordStrengthService`), but there is a gap between those primitives and the **everyday security needs of real Angular applications**:

- Consumers write the same glue code (e.g. wrapping `PasswordStrengthService` into a `FormControl` validator) over and over.
- No idiomatic solution for **JWT inspection** — everyone installs `jwt-decode` + rolls their own expiration helper.
- No first-class **CSRF helper** with a functional HTTP interceptor; Angular core only offers the legacy `HttpClientXsrfModule` (NgModule-based).
- No **client-side rate limiter** to protect the user's own backend from accidental bursts (clicks, retries, typeahead spam).
- No **leaked-password check** (HIBP k-anonymity) to complement entropy-based scoring — entropy tells you if it's _strong_, HIBP tells you if it's already _pwned_.
- No **sensitive-clipboard** helper (auto-clear after N seconds), which is a well-established pattern in password managers.

Users currently either roll their own or pull in several third-party libraries with mixed Angular compatibility.

## Objective

Extend `@angular-helpers/security` with **seven high-value, framework-idiomatic utilities** that close the gap between existing primitives and real-world Angular application needs, without introducing breaking changes. Forms integration covers **both** Angular paradigms: classic Reactive Forms AND the new Signal Forms API shipped in Angular v21.

All new utilities must:

- Be standalone, tree-shakeable, and signal-friendly (Angular v20+, zoneless-compatible).
- Be exposed via individual `provide*()` functions AND integrated into `provideSecurity()`.
- Reuse existing services (`PasswordStrengthService`, `InputSanitizerService`, `WebCryptoService`) where applicable instead of duplicating logic.
- Ship with README updates (EN + ES), docs page entries, demo in `library-services-harness`, and a blog post.

## In-Scope

### New services

1. **`SecurityValidators`** (Reactive Forms) — Static class of validators bridging existing services:
   - `strongPassword({ minScore })` — delegates to `PasswordStrengthService`
   - `safeHtml()` — delegates to `InputSanitizerService`
   - `safeUrl({ schemes })` — delegates to `InputSanitizerService`
   - `noScriptInjection()` — lightweight pattern check
   - `noSqlInjectionHints()` — heuristic pattern check

2. **Signal Forms validators** (`@angular-helpers/security/signal-forms` sub-entry point) — Angular v21 Signal Forms rule functions mirroring the Reactive set:
   - `strongPassword(path, { minScore, message })`
   - `safeHtml(path, { message })`
   - `safeUrl(path, { schemes, message })`
   - `noScriptInjection(path, { message })`
   - `noSqlInjectionHints(path, { message })`
   - `hibpPassword(path, { message })` — async validator wrapping `HibpService` via `validateAsync`
   - Each function is idiomatic with `form(model, (p) => { strongPassword(p.password); })` and returns `ValidationError | null`
   - Uses `@angular/forms/signals` as an additional peer dependency (declared only for this sub-entry point)

3. **`JwtService`** — Client-side JWT utilities (decode/inspect only, NOT verify):
   - `decode<T>(token): T`
   - `isExpired(token): boolean`
   - `expiresIn(token): number` (ms)
   - `claim<T>(token, name): T | null`
   - Explicit documentation that signature verification must happen server-side.

4. **`CsrfService` + `withCsrfHeader()` interceptor** — Double-submit cookie pattern:
   - `generateToken(): string` (uses `WebCryptoService.generateRandomBytes`)
   - `storeToken(token)` / `getToken()` / `clearToken()`
   - Functional interceptor injecting `X-CSRF-Token` header on unsafe methods (POST/PUT/PATCH/DELETE).

5. **`RateLimiterService`** — Token-bucket / sliding-window client-side rate limiting:
   - `consume(key, tokens?): Promise<void>` (throws `RateLimitExceeded` when exhausted)
   - `canExecute(key): Signal<boolean>`
   - `remaining(key): Signal<number>`
   - `reset(key)`
   - Configurable per-key policies via injection token.

6. **`HibpService`** — Have I Been Pwned k-anonymity check:
   - `isPasswordLeaked(password): Promise<{ leaked: boolean; count: number }>`
   - Computes SHA-1, sends first 5 hex chars to `https://api.pwnedpasswords.com/range/{prefix}`, matches locally.
   - Explicit docs: requires secure context, sends only 5-char prefix (no full password leaves the browser).

7. **`SensitiveClipboardService`** — Copy with auto-clear:
   - `copy(text, { clearAfterMs })` — writes, schedules clear, verifies clipboard still contains the copied value before clearing (avoids nuking unrelated user data).
   - `copy$(text, options): Observable<CopyStatus>` — emits `'copied' | 'cleared' | 'error'`.

### Providers

Extend `providers.ts`:

- Add `provideSecurityValidators()` (stateless, exposes tree-shakeable static class — no provider actually needed; ship as a namespace).
- Add `provideJwt()`, `provideCsrf(config?)`, `provideRateLimiter(config?)`, `provideHibp()`, `provideSensitiveClipboard()`.
- Extend `SecurityConfig` with `enableJwt`, `enableCsrf`, `enableRateLimiter`, `enableHibp`, `enableSensitiveClipboard` flags (all opt-in, default `false`).
- Signal Forms validators are pure functions exported from `@angular-helpers/security/signal-forms` — no provider required; users import functions directly into their schema.

### Documentation

- `packages/security/README.md` + `README.es.md` — new sections per service plus a dedicated section for the Signal Forms sub-entry point.
- `src/app/docs/data/security.data.ts` — entries per new service with API reference + example, including side-by-side Reactive Forms vs Signal Forms snippets.
- Blog post at `public/content/blog/security-utilities-expansion.md` covering the rationale, API surface, boundaries, and the Signal Forms bridge design.
- Demo additions in `src/app/demo/library-services-harness/` for each new service. Forms demos show BOTH Reactive Forms and Signal Forms variants for direct comparison.

### Tests

- Unit tests alongside each service following existing patterns in the repo.
- Playwright headless coverage in `test/browser/` for demos of the new services (secure context where required).

## Out-of-Scope (explicit non-goals)

The following are intentionally deferred to a future change to keep this PR reviewable:

- `TotpService` (RFC 6238) — trivially implementable once HMAC exists; postpone to bundle with WebAuthn/2FA work.
- `WebAuthnService` — larger surface, deserves its own SDD cycle.
- `NonceService` + `provideCspMeta()` — SSR/CSP integration concerns warrant a separate design.
- Signal-based adapters for existing services (`passwordStrength.asSignal(...)`, `secureStorage.asSignal(...)`).
- Key rotation for `SecureStorageService`.
- Testing helpers package (`provideSecurityTesting()` with in-memory backends).
- Server-side JWT verification — out of scope by design (client library).
- JWT refresh-token flow automation — application concern, not library concern.

## Approach

### Branch strategy

Single feature branch `feat/security-utilities-expansion`. One PR. Atomic commits per service using conventional commits:

- `feat(security): add SecurityValidators with strong-password, safe-html, safe-url`
- `feat(security): add signal-forms sub-entry with Signal Forms rule functions`
- `feat(security): add JwtService for client-side token inspection`
- `feat(security): add CsrfService and withCsrfHeader interceptor`
- `feat(security): add RateLimiterService with token-bucket policy`
- `feat(security): add HibpService for leaked-password check`
- `feat(security): add SensitiveClipboardService with auto-clear`
- `docs(security): expand README + docs data with new utilities`
- `feat(security): add demos for new utilities in library-services-harness`
- `docs(blog): publish security utilities expansion post`
- `chore(security): bump version to 21.3.0`

### Key design decisions

1. **`SecurityValidators` as a static class** rather than injectable — Angular validators are pure functions; no DI needed. Reduces boilerplate for consumers. The underlying services are injected lazily at call time via `inject()` inside the validator factory using `runInInjectionContext`.
2. **Signal Forms as a separate sub-entry point** (`@angular-helpers/security/signal-forms`) — isolates the `@angular/forms/signals` peer dependency so consumers on Reactive Forms don't pay bundle cost, mirrors the existing `worker-http` sub-packaging pattern.
3. **Signal Forms validators are pure path-consuming functions** (not factories) — `strongPassword(p.password, opts)` matches the idiomatic Signal Forms schema style, unlike the Reactive `ValidatorFn` factories. The same logic is extracted into shared private helpers reused by both paradigms to guarantee parity (AC-10 test).
4. **`JwtService` explicitly NON-verifying** — surface is clearly documented as inspection-only. Any `verify()` method would mislead consumers into trusting client-side validation.
5. **`CsrfService` uses `WebCryptoService.generateRandomBytes`** — no crypto duplication, leverages existing primitive.
6. **`RateLimiterService` uses signals natively** — `canExecute` and `remaining` return `Signal<T>` instead of observables, matching modern Angular practices. In-memory only for v1; cross-tab persistence deferred.
7. **`HibpService` uses native `fetch`** — avoids forcing `HttpClient` dependency for one call; surface is simple enough. Explicit CORS and secure-context requirements documented.
8. **All new services are opt-in** — `SecurityConfig` flags default `false` to keep `provideSecurity()` backwards-compatible and bundle-lean for existing consumers.

### Integration order (implementation sequence)

1. Shared validator core helpers (pure TS extracting pattern/entropy logic) → reused by both forms paradigms.
2. `SecurityValidators` (Reactive Forms, consumes shared helpers) → fastest win.
3. Signal Forms sub-entry point scaffolding (`packages/security/signal-forms/` with its own `ng-package.json`) + validator functions (consume shared helpers).
4. `JwtService` (self-contained, no external deps).
5. `SensitiveClipboardService` (uses `navigator.clipboard`, self-contained).
6. `HibpService` (external HTTP + SHA-1 via `WebCryptoService`).
7. `hibpPassword` async Signal Forms validator (depends on `HibpService`).
8. `RateLimiterService` (signals + config token).
9. `CsrfService` + interceptor (last — touches HTTP layer).
10. README + docs data + demos + blog post + version bump.

## Risks

| Risk                                                                     | Severity | Mitigation                                                                                                                                                                |
| ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIBP endpoint rate-limits or CORS changes                                | Medium   | Document fallback, treat any network failure as `{ leaked: false, count: 0, error: ... }`. Never throw.                                                                   |
| `SecurityValidators` DI at validator call time introduces context errors | Medium   | Use `runInInjectionContext` with explicit `Injector` capture at factory creation; unit-test in OnPush + zoneless environment.                                             |
| Clipboard auto-clear nukes unrelated user data                           | High     | Read clipboard before clearing, only clear if content still matches what we wrote. Document browser permission gotchas.                                                   |
| `CsrfService` interacts poorly with existing Angular XSRF mechanisms     | Medium   | Different header name by default (`X-CSRF-Token` vs Angular's `X-XSRF-TOKEN`); document interop in README.                                                                |
| Signal Forms API is developer preview in v21 and may shift in v22        | Medium   | Pin to v21 API surface; isolate in sub-entry so future breaking changes only affect `signal-forms` export; cover with Playwright demos to catch API drift early.          |
| Parity drift between Reactive and Signal Forms validator logic           | Medium   | Extract shared pure helpers (pattern checks, entropy wiring) into a `validators-core.ts` module; both paradigms delegate to it; AC-10 test asserts equivalence per input. |
| Bundle size creep                                                        | Low      | All services opt-in; individual `provide*()` functions ensure tree-shaking; Signal Forms isolated in sub-entry; verify `dist/security` size before merge.                 |
| Blog post scope creep delays merge                                       | Low      | Keep post focused on rationale + API surface; defer deep dives to follow-up posts per service.                                                                            |

## Open Assumptions

- The project's release automation (semantic-release) will consume conventional commit messages and bump `21.2.0` → `21.3.0` automatically; no manual version edits in `package.json` required in-commit.
- `HibpService` calling an external endpoint is acceptable; otherwise we'd need an injectable client abstraction — decision deferred to review.
- Demo additions go into the existing `library-services-harness` component rather than new per-service demo components.
- All new services must be zoneless-compatible by construction (no `ngZone`-sensitive APIs).
- `@angular/forms/signals` in Angular 21 is stable enough to ship as a peer dependency of the `signal-forms` sub-entry. If the user prefers to gate behind developer-preview warnings, we can wrap imports and emit a one-time console notice when the sub-entry is first used.

## Pending Decisions (require user input before implementation)

1. **HIBP endpoint configurability**: hard-code `https://api.pwnedpasswords.com/range/` or expose via `HIBP_ENDPOINT` injection token? Default to hard-coded, token optional for enterprise proxies?
2. **CSRF storage strategy**: `sessionStorage` (default), `cookie`, or both? Cookie requires app-level awareness of `SameSite`/`Secure` attributes.
3. **Rate limiter cross-tab sharing**: in-memory only for v1 (recommended) vs. optional `BroadcastChannel`-based sync?
4. **Reactive Forms async password validator**: keep sync (entropy only) or offer async variant that also calls `HibpService`? (Signal Forms gets `hibpPassword` async rule regardless.)
5. **Signal Forms peer dependency**: add `@angular/forms` as a peer only when the `signal-forms` sub-entry is imported (preferred), or at package level? Decision affects consumers not using forms at all.
