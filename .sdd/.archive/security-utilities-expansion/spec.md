# Spec: Security Utilities Expansion

**Companion to**: `.sdd/proposal.md`
**Target package**: `@angular-helpers/security`

---

## Functional Requirements

### FR-1: `SecurityValidators` (Reactive Forms)

- **FR-1.1**: Expose a static class `SecurityValidators` with factory functions returning `ValidatorFn` or `AsyncValidatorFn`.
- **FR-1.2**: `SecurityValidators.strongPassword(options?: { minScore?: 0|1|2|3|4 })` — returns `ValidatorFn` that:
  - Returns `null` when `control.value` is falsy.
  - Invokes `PasswordStrengthService.assess(value).score` at validation time via `inject(PasswordStrengthService)`.
  - Returns `{ weakPassword: { score, required } }` when `score < minScore` (default `minScore: 2`).
- **FR-1.3**: `SecurityValidators.safeHtml()` — returns `ValidatorFn`:
  - Returns `null` for empty input.
  - Invokes `InputSanitizerService.sanitizeHtml(value)`; if sanitized output differs from input, returns `{ unsafeHtml: true }`.
- **FR-1.4**: `SecurityValidators.safeUrl(options?: { schemes?: string[] })` — returns `ValidatorFn`:
  - Returns `null` for empty input.
  - Invokes `InputSanitizerService.sanitizeUrl(value)`; returns `{ unsafeUrl: true }` if `null`.
  - When `schemes` is provided, also rejects URLs whose protocol is not in `schemes` (default `['http:', 'https:']`).
- **FR-1.5**: `SecurityValidators.noScriptInjection()` — returns `ValidatorFn` that rejects values matching `/<\s*script\b|javascript:|on\w+\s*=/i`; returns `{ scriptInjection: true }`.
- **FR-1.6**: `SecurityValidators.noSqlInjectionHints()` — heuristic validator rejecting common SQLi sentinel strings (`' OR '1'='1`, `--`, `;--`, `/*`, `UNION SELECT` case-insensitive); returns `{ sqlInjectionHint: true }`.
- **FR-1.7**: All validators MUST be usable without wrapping in `runInInjectionContext` at the call site — the library handles injection context internally.

### FR-2: Signal Forms validators (`@angular-helpers/security/signal-forms`)

- **FR-2.1**: Ship as an ng-packagr **secondary entry point** at `packages/security/signal-forms/` with its own `ng-package.json` and `src/index.ts`. The public import specifier is `@angular-helpers/security/signal-forms`.
- **FR-2.2**: The sub-entry declares `@angular/forms ^21.0.0` as an additional peer dependency. The main entry point (`@angular-helpers/security`) MUST NOT depend on `@angular/forms`.
- **FR-2.3**: `strongPassword(path: FieldPath<string>, opts?: { minScore?: 0|1|2|3|4; message?: string }): void` — registers a sync `validate()` rule that calls shared `assessPassword()` helper and returns `{ kind: 'weakPassword', message, score, required }` when below threshold, `null` otherwise.
- **FR-2.4**: `safeHtml(path: FieldPath<string>, opts?: { message?: string }): void` — registers a sync rule that parses via `DOMParser` (inline, no service dependency to avoid DI in Signal Forms schema context) and returns `{ kind: 'unsafeHtml', message }` when sanitization alters the input.
- **FR-2.5**: `safeUrl(path: FieldPath<string>, opts?: { schemes?: string[]; message?: string }): void` — registers a sync rule using the shared URL check helper; returns `{ kind: 'unsafeUrl', message }` on failure.
- **FR-2.6**: `noScriptInjection(path: FieldPath<string>, opts?: { message?: string }): void` — same regex as FR-1.5; returns `{ kind: 'scriptInjection', message }`.
- **FR-2.7**: `noSqlInjectionHints(path: FieldPath<string>, opts?: { message?: string }): void` — same heuristics as FR-1.6; returns `{ kind: 'sqlInjectionHint', message }`.
- **FR-2.8**: `hibpPassword(path: FieldPath<string>, opts?: { message?: string; debounceMs?: number }): void` — registers a `validateAsync()` rule:
  - Skips when value length < 8 or value is empty (returns `undefined` from params).
  - Uses a custom resource factory that injects `HibpService` and calls `isPasswordLeaked`.
  - Debounces value changes by `debounceMs` (default `300`).
  - Returns `{ kind: 'leakedPassword', message, count }` when `leaked === true`, `null` otherwise.
  - Treats `error: 'network' | 'unsupported'` as pass (no validation error) — never blocks form submission due to HIBP outage.
- **FR-2.9**: All Signal Forms validator functions MUST respect the `message` option for UX; when omitted, a sensible English default is used (e.g. `'Password too weak'`, `'Value contains unsafe HTML'`, `'URL scheme not allowed'`).
- **FR-2.10**: The sub-entry MUST NOT export `provide*()` functions — Signal Forms validators are pure and stateless; no DI registration is required. `hibpPassword` resolves `HibpService` via `inject()` inside the resource factory, delegating DI to the component injector context that Signal Forms already provides.
- **FR-2.11**: A shared helper module at `packages/security/src/internal/validators-core.ts` MUST host the pure logic (`assessPassword`, `isUrlSafe`, `containsScriptInjection`, `containsSqlInjectionHints`, `runHtmlSanitizerCheck`). Both FR-1 and FR-2 implementations MUST consume this module to guarantee behavioural parity.

### FR-3: `JwtService`

- **FR-3.1**: `decode<T>(token: string): T` — splits on `.`, base64-url-decodes the payload segment, `JSON.parse` it, returns typed payload. Throws `InvalidJwtError` when token is malformed.
- **FR-3.2**: `isExpired(token: string, leewaySeconds?: number): boolean` — returns `true` when `exp * 1000 <= Date.now() - leeway*1000`; returns `true` for missing/invalid `exp`.
- **FR-3.3**: `expiresIn(token: string): number` — returns milliseconds until expiration (negative when expired, `0` when no `exp`).
- **FR-3.4**: `claim<T>(token: string, name: string): T | null` — typed accessor; returns `null` when claim absent.
- **FR-3.5**: Service MUST NOT expose any method named `verify`, `validate`, or similar to avoid consumer confusion.
- **FR-3.6**: Public JSDoc on the class MUST state: "This service decodes JWT payloads for client-side inspection only. Signature verification MUST happen server-side."

### FR-4: `CsrfService` + `withCsrfHeader()`

- **FR-4.1**: `CsrfService.generateToken(): string` — returns 32-byte hex token from `WebCryptoService.generateRandomBytes(32)`.
- **FR-4.2**: `CsrfService.storeToken(token: string): void` — persists to configured storage (`sessionStorage` default).
- **FR-4.3**: `CsrfService.getToken(): string | null`.
- **FR-4.4**: `CsrfService.clearToken(): void`.
- **FR-4.5**: `withCsrfHeader(options?: { headerName?: string; methods?: HttpMethod[] }): HttpInterceptorFn`:
  - Injects `CsrfService`.
  - On requests matching `methods` (default `['POST','PUT','PATCH','DELETE']`), reads the token and sets `headerName` (default `X-CSRF-Token`).
  - Skips the header when token is `null`.
  - Does not generate tokens automatically — token lifecycle is the application's responsibility (consistent with double-submit pattern).
- **FR-4.6**: `CSRF_CONFIG` injection token exposes `{ storage?: 'local' | 'session'; storageKey?: string }` with defaults `'session'` / `'__csrf_token__'`.

### FR-5: `RateLimiterService`

- **FR-5.1**: `configure(key: string, policy: RateLimitPolicy): void` where `RateLimitPolicy = { type: 'token-bucket'; capacity: number; refillPerSecond: number } | { type: 'sliding-window'; max: number; windowMs: number }`.
- **FR-5.2**: `consume(key: string, tokens?: number): Promise<void>` — resolves when capacity allows, rejects with `RateLimitExceededError` (containing `{ key, retryAfterMs }`) when exhausted.
- **FR-5.3**: `canExecute(key: string): Signal<boolean>` — recomputes on consume/refill.
- **FR-5.4**: `remaining(key: string): Signal<number>`.
- **FR-5.5**: `reset(key: string): void`.
- **FR-5.6**: Unknown keys: `canExecute` returns `signal(true)`, `remaining` returns `signal(Infinity)`, `consume` is a no-op — fail-open for undeclared keys.
- **FR-5.7**: `RATE_LIMITER_CONFIG` injection token exposes `{ defaults?: Record<string, RateLimitPolicy> }` so apps can declare policies at bootstrap.

### FR-6: `HibpService`

- **FR-6.1**: `isPasswordLeaked(password: string): Promise<HibpResult>` where `HibpResult = { leaked: boolean; count: number; error?: 'network' | 'unsupported' }`.
- **FR-6.2**: Implementation MUST:
  1. Compute SHA-1 of the password via `WebCryptoService.hash(password, 'SHA-1')` (uppercase hex).
  2. Send the first 5 hex chars as `GET https://api.pwnedpasswords.com/range/{prefix}` with header `Add-Padding: true`.
  3. Parse response lines `SUFFIX:COUNT`, find match for the remaining 35 chars, return `{ leaked: true, count }` or `{ leaked: false, count: 0 }`.
- **FR-6.3**: On network error, return `{ leaked: false, count: 0, error: 'network' }` — MUST NOT throw.
- **FR-6.4**: On non-browser / no-secure-context, return `{ leaked: false, count: 0, error: 'unsupported' }`.
- **FR-6.5**: `HIBP_CONFIG` injection token allows overriding the endpoint base URL (for enterprise proxies or tests).

### FR-7: `SensitiveClipboardService`

- **FR-7.1**: `copy(text: string, options?: { clearAfterMs?: number }): Promise<void>` — writes via `navigator.clipboard.writeText`, schedules clear after `clearAfterMs` (default `15000`, `0` disables).
- **FR-7.2**: Before clearing, service MUST call `navigator.clipboard.readText()` and only clear when current content still equals the copied text (prevents clobbering unrelated user copies).
- **FR-7.3**: `copy$(text, options): Observable<'copied' | 'cleared' | 'read-denied' | 'error'>` — convenience reactive variant.
- **FR-7.4**: On browsers without `navigator.clipboard`, `copy` rejects with `ClipboardUnsupportedError`.
- **FR-7.5**: Service MUST cancel any pending clear timer when the owner's injector is destroyed (use `DestroyRef`).

### FR-8: Providers integration

- **FR-8.1**: Extend `SecurityConfig` with `enableJwt`, `enableCsrf`, `enableRateLimiter`, `enableHibp`, `enableSensitiveClipboard` — all default `false`.
- **FR-8.2**: Add individual `provideJwt()`, `provideCsrf(config?)`, `provideRateLimiter(config?)`, `provideHibp(config?)`, `provideSensitiveClipboard()` exports.
- **FR-8.3**: `provideCsrf` returns providers for `CsrfService` but does NOT register the interceptor — interceptor registration is opt-in via `provideHttpClient(withInterceptors([withCsrfHeader()]))`.
- **FR-8.4**: Public barrel `packages/security/src/index.ts` exports all new services, tokens, interceptor function, and error classes.
- **FR-8.5**: Signal Forms sub-entry barrel `packages/security/signal-forms/src/index.ts` exports ONLY the validator functions (`strongPassword`, `safeHtml`, `safeUrl`, `noScriptInjection`, `noSqlInjectionHints`, `hibpPassword`) and their option types. No services, no providers.

## Non-Functional Requirements

- **NFR-1 (Zoneless compatibility)**: All services MUST work in a zoneless Angular v20+ app. No usage of `NgZone`, no `setTimeout` inside change-detection-sensitive paths.
- **NFR-2 (SSR safety)**: All services MUST guard browser-only APIs (`navigator.clipboard`, `crypto.subtle`, `sessionStorage`, `fetch`) with `isPlatformBrowser` and throw explicit errors on the server. `HibpService.isPasswordLeaked` returns `{ leaked: false, error: 'unsupported' }` on SSR rather than throwing.
- **NFR-3 (Tree-shakeable)**: Each `provide*()` function MUST be importable independently without pulling the other services. No top-level side effects in `index.ts` beyond re-exports.
- **NFR-4 (Type safety)**: No `any`. `unknown` is acceptable where types truly are unknown (e.g. JWT claims before narrowing). All public APIs MUST have explicit return types.
- **NFR-5 (Bundle size)**: Adding all seven new services, opt-in, MUST not increase `provideSecurity({})` (empty config) bundle size by more than 200 bytes gzipped. The `signal-forms` sub-entry is isolated: not importing it produces zero impact on the consumer bundle.
- **NFR-6 (Documentation parity)**: Every new public method MUST appear in `README.md`, `README.es.md`, and `src/app/docs/data/security.data.ts` with at least one usage example.
- **NFR-7 (Accessibility of demos)**: New demos MUST pass AXE checks and WCAG AA minimums (same rule as existing demos).
- **NFR-8 (Test coverage)**: Each new service MUST have at least one happy-path and one error-path test. Interceptors are covered via Playwright flows where practical.
- **NFR-9 (Changelog)**: Commits MUST use conventional commit format so semantic-release picks up the minor bump correctly.

## Use Scenarios

### Scenario S-1a: Reactive Forms — password form with full strength pipeline

A sign-up form uses `strongPassword` validator + HIBP check on submit.

```ts
form = new FormGroup({
  password: new FormControl('', [
    Validators.required,
    SecurityValidators.strongPassword({ minScore: 3 }),
  ]),
});

async submit() {
  const { leaked } = await this.hibp.isPasswordLeaked(this.form.value.password!);
  if (leaked) return this.form.controls.password.setErrors({ leaked: true });
  // proceed
}
```

### Scenario S-1b: Signal Forms — equivalent pipeline, declarative + async

```ts
import { signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { strongPassword, hibpPassword } from '@angular-helpers/security/signal-forms';

class SignupComponent {
  model = signal({ email: '', password: '' });

  f = form(this.model, (p) => {
    required(p.password, { message: 'Password is required' });
    strongPassword(p.password, { minScore: 3, message: 'Too weak' });
    hibpPassword(p.password, { message: 'This password has appeared in a breach' });
  });

  async submit() {
    if (this.f().invalid() || this.f().pending()) return;
    // proceed — all checks (including async HIBP) already passed
  }
}
```

The Signal Forms variant is fully declarative: HIBP runs automatically as async validation, no manual `submit()` plumbing required. Both scenarios MUST produce equivalent validation outcomes for the same input (AC-10).

### Scenario S-2: API client with automatic CSRF header

```ts
bootstrapApplication(App, {
  providers: [
    provideSecurity({ enableCsrf: true }),
    provideHttpClient(withInterceptors([withCsrfHeader()])),
  ],
});

// On login
const csrf = inject(CsrfService);
csrf.storeToken(response.csrfToken);
// subsequent POST/PUT/PATCH/DELETE requests automatically carry X-CSRF-Token
```

### Scenario S-3: Rate-limited search

```ts
this.rateLimiter.configure('search', { type: 'token-bucket', capacity: 5, refillPerSecond: 1 });

async onSearch(query: string) {
  try {
    await this.rateLimiter.consume('search');
    this.results = await this.api.search(query);
  } catch (e) {
    if (e instanceof RateLimitExceededError) this.toast.warn(`Slow down, retry in ${e.retryAfterMs}ms`);
  }
}

// In template:
// <button [disabled]="!rateLimiter.canExecute('search')()">Search</button>
```

### Scenario S-4: Copy API key with auto-clear

```ts
await this.sensitiveClipboard.copy(apiKey, { clearAfterMs: 15_000 });
this.toast.info('Key copied — clipboard will clear in 15s');
```

### Scenario S-5: Inspect JWT expiration

```ts
const token = localStorage.getItem('access_token');
if (!token || this.jwt.isExpired(token, 30)) {
  this.router.navigate(['/login']);
}
const userId = this.jwt.claim<string>(token, 'sub');
```

## Acceptance Criteria

- **AC-1**: Running `npm run build` for `@angular-helpers/security` completes without errors.
- **AC-2**: `npm run lint` and `npm run format:check` pass on all modified files.
- **AC-3**: All existing Playwright tests still pass; new demos have at least one Playwright spec each (or coverage via an existing spec).
- **AC-4**: `dist/security` does NOT include `.map` files (per existing `build:prod`).
- **AC-5**: `README.md` + `README.es.md` + `src/app/docs/data/security.data.ts` include entries for every new public method.
- **AC-6**: Blog post at `public/content/blog/security-utilities-expansion.md` exists, is linked in `src/app/blog/config/posts.data.ts`, and renders on the blog route.
- **AC-7**: `provideSecurity({})` with default config produces identical runtime behaviour as `21.2.0` for existing consumers (no behaviour regressions).
- **AC-8**: `packages/security/package.json` version bumped to `21.3.0` (or left unchanged if semantic-release handles it — decision per proposal assumption).
- **AC-9**: Every new service can be injected and used in a zoneless standalone Angular v20+ harness without throwing `NullInjectorError` or zone-related warnings.
- **AC-10**: `SecurityValidators.strongPassword()` (Reactive) and the Signal Forms `strongPassword()` rule produce equivalent validation outcomes for the same input — both MUST be backed by the shared `assessPassword()` helper in `validators-core.ts`. A unit test table asserts parity across 20 representative inputs.
- **AC-11**: `@angular-helpers/security/signal-forms` imports cleanly into a fresh Angular v21 standalone component using `form()` and runs without runtime errors. Verified via a Playwright scenario.
- **AC-12**: `dist/security/signal-forms/` is built as a proper ng-packagr secondary entry point (own `package.json`, own `fesm2022/`, own `.d.ts`). Consumers get correct TypeScript resolution for `@angular-helpers/security/signal-forms`.
- **AC-13**: Importing ONLY from `@angular-helpers/security` (main entry) MUST NOT pull `@angular/forms` into the consumer bundle — verified by inspecting the output or via a simple tree-shake spot check.

## Technical Constraints

- **TC-1**: Main-entry peer dependencies remain `@angular/common ^21.0.0`, `@angular/core ^21.0.0`, `rxjs ^7 || ^8`. `@angular/forms ^21.0.0` is added **only** as a peer of the `signal-forms` sub-entry, declared in `packages/security/signal-forms/package.json` (or at the root `peerDependenciesMeta` with `optional: true`, pending ng-packagr capability).
- **TC-2**: Runtime dependencies remain `tslib ^2` only. No `jwt-decode`, `uuid`, or similar; implement in-package or reuse `WebCryptoService`.
- **TC-3**: All files follow existing naming: `kebab-case.service.ts`, one service per file.
- **TC-4**: All code comments, JSDoc, and documentation MUST be in English. User-facing log messages in English.
- **TC-5**: No `console.log` / `console.warn` / `console.error` in production code paths (existing repo convention per oxlint rules).
- **TC-6**: CSS for demo components follows Tailwind/DaisyUI patterns already established in `library-services-harness`.
- **TC-7**: Signal Forms sub-entry MUST be tested against the exact Angular v21 API (`@angular/forms/signals` + `@angular/forms/signals/compat`). Any helper pulled from developer-preview-only paths MUST be documented in the sub-entry README.

## Known Edge Cases

- **EC-1**: JWT with unpadded base64url payload — decoder MUST pad before `atob`.
- **EC-2**: JWT with non-JSON payload — decoder MUST throw `InvalidJwtError` with context.
- **EC-3**: HIBP returns 404 when prefix has no matches (rare but possible on mocks) — treat as `{ leaked: false, count: 0 }`.
- **EC-4**: `navigator.clipboard.readText()` prompts for permission on some browsers — if denied, `SensitiveClipboardService` emits `'read-denied'` and SKIPS the clear (we don't overwrite unknown content).
- **EC-5**: Rate limiter key collision with a legitimate namespace — documented: keys are app-scoped; advise using `'feature:action'` convention.
- **EC-6**: CSRF interceptor running before user logs in — when token is `null`, header is omitted silently.
- **EC-7**: `SecurityValidators.safeHtml` on whitespace-only input — treated as empty, returns `null`.
- **EC-8**: `RateLimiterService.consume` called with `tokens > capacity` — rejects immediately with `RateLimitExceededError` (never resolvable).
- **EC-9**: Signal Forms `hibpPassword` invoked while offline — `HibpService` returns `{ error: 'network' }`, rule returns `null` (no error), form remains submittable. Documented as intentional fail-open behaviour.
- **EC-10**: Signal Forms `hibpPassword` called rapidly (typing) — Signal Forms request cancellation + our `debounceMs` (default 300) prevent request storms. Confirmed in Playwright demo.
- **EC-11**: Consumer imports `strongPassword` from both `@angular-helpers/security` (Reactive) and `@angular-helpers/security/signal-forms` in the same file — names are identical but signatures differ; TypeScript disambiguates by argument shape. README MUST show aliased imports (`import { strongPassword as strongPasswordRule } ...`) as a recommended pattern.
