---
title: 'security v21.3: JWT, HIBP, rate limiter, and a two-paradigm forms bridge'
publishedAt: 2026-04-21
tags: [security, angular, signal-forms, reactive-forms, jwt, hibp, csrf, rate-limiter]
excerpt: Seven new utilities land in @angular-helpers/security, including a Reactive Forms bridge, a Signal Forms bridge with async HIBP validation, client-side JWT inspection, CSRF helpers, and a verified-auto-clear sensitive clipboard.
---

`@angular-helpers/security` started as a narrow toolbox: ReDoS-safe regex, AES-GCM primitives, encrypted storage, input sanitization, password strength. Solid building blocks, but there was always a gap between those primitives and what real Angular apps reach for every day — **form validators, JWT inspection, CSRF, rate limiting, leaked-password checks, sensitive-clipboard handling**.

v21.3 fills that gap with **seven new utilities** and **two new sub-entry points** (`@angular-helpers/security/forms` for Reactive Forms, `@angular-helpers/security/signal-forms` for Angular v21's Signal Forms). The existing five services stay untouched — every change is additive and opt-in.

## Why this release, in one paragraph

Most security packages stop at the primitives. What users actually ship is a sign-up form that needs `required`, `strongPassword`, `safeHtml`, `safeUrl`, and ideally an async Have-I-Been-Pwned check. A session guard that needs to read a JWT's `exp`. An HTTP interceptor that injects a CSRF token. A search-as-you-type flow that should not hammer the backend. A "copy API key" button that behaves like a password manager. Each of these is a half-day of plumbing in every app. We packaged them so you write zero of that.

## What's new

### 1. `SecurityValidators` — Reactive Forms bridge

Lives in `@angular-helpers/security/forms`. Five static factory validators bridging the existing services into the `ValidatorFn` contract:

```typescript
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SecurityValidators } from '@angular-helpers/security/forms';

form = new FormGroup({
  password: new FormControl('', [
    Validators.required,
    SecurityValidators.strongPassword({ minScore: 3 }),
  ]),
  bio: new FormControl('', [SecurityValidators.safeHtml()]),
  homepage: new FormControl('', [SecurityValidators.safeUrl({ schemes: ['https:'] })]),
});
```

No provider registration. Tree-shakeable. Sub-entry isolates the `@angular/forms` dependency so consumers who don't use forms pay zero bundle cost.

### 2. Signal Forms validators

Lives in `@angular-helpers/security/signal-forms`. Idiomatic rule functions for Angular v21's new `form()` API:

```typescript
import { signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import {
  strongPassword,
  hibpPassword,
  safeHtml,
  safeUrl,
} from '@angular-helpers/security/signal-forms';

model = signal({ email: '', password: '', bio: '', homepage: '' });

f = form(this.model, (p) => {
  required(p.email);
  required(p.password);
  strongPassword(p.password, { minScore: 3 });
  hibpPassword(p.password); // async via validateAsync — debounced + abortable
  safeHtml(p.bio);
  safeUrl(p.homepage, { schemes: ['https:'] });
});
```

The sync rules mirror the Reactive Forms set. The async `hibpPassword` is the reason this sub-entry exists: Signal Forms' `validateAsync` + `resource` gives us debouncing, automatic cancellation on value change, and clean integration with the field's `pending()` signal — all of it declarative, none of it your code.

### 3. Shared core for guaranteed parity

Both paradigms delegate to a new internal module `packages/security/src/internal/validators-core.ts`. Pure TypeScript, zero DI, no Angular imports:

```typescript
export function assessPasswordStrength(password: string): PasswordAssessment { ... }
export function isUrlSafe(input: string, schemes?: readonly string[]): boolean { ... }
export function isHtmlSafe(input: string, options?: HtmlSanitizerOptions): boolean { ... }
export function containsScriptInjection(input: string): boolean { ... }
export function containsSqlInjectionHints(input: string): boolean { ... }
```

`PasswordStrengthService.assess()` and `InputSanitizerService.sanitizeHtml()` were refactored to delegate to these helpers — same public API, zero behaviour change, but now the Reactive Forms and Signal Forms validators share the same ground truth. No parity drift, no duplicated regex.

### 4. `JwtService` — client-side JWT inspection

```typescript
const jwt = inject(JwtService);

jwt.decode<MyClaims>(token); // throws InvalidJwtError on malformed input
jwt.isExpired(token, 30); // 30-second leeway, fail-secure on missing exp
jwt.expiresIn(token); // ms until expiration, negative when expired
jwt.claim<string>(token, 'sub'); // typed claim accessor, null when absent
```

Four methods, zero external dependencies, no `jwt-decode` needed. The class explicitly **does not** expose `verify()` — signature validation is server-side, and exposing a client-side "verify" would mislead users into trusting it.

### 5. `CsrfService` + `withCsrfHeader()` functional interceptor

Double-submit cookie pattern, functional API (Angular's built-in `HttpClientXsrfModule` is NgModule-based):

```typescript
bootstrapApplication(App, {
  providers: [
    provideSecurity({ enableCsrf: true }),
    provideHttpClient(withInterceptors([withCsrfHeader()])),
  ],
});

// On login
csrf.storeToken(response.csrfToken);
// Every POST/PUT/PATCH/DELETE now carries X-CSRF-Token automatically.
```

Header name defaults to `X-CSRF-Token` to avoid interaction with Angular's built-in `X-XSRF-TOKEN`. Token lifecycle stays in your hands — the service stores, reads, and clears, the backend issues.

### 6. `RateLimiterService` — signal-based token-bucket / sliding-window

```typescript
rateLimiter.configure('search', { type: 'token-bucket', capacity: 5, refillPerSecond: 1 });

await rateLimiter.consume('search'); // throws RateLimitExceededError when exhausted

rateLimiter.canExecute('search'); // Signal<boolean> — drop into [disabled]
rateLimiter.remaining('search'); // Signal<number>  — drop into countdown UIs
```

Token-bucket gives you smooth rate limiting with burst capacity. Sliding-window gives you strict max-per-window. Unknown keys are fail-open — if you forgot to configure, the consumer doesn't crash, it just runs unthrottled. State is in-memory for v1; cross-tab sync is a future iteration.

### 7. `HibpService` — Have I Been Pwned check

```typescript
const { leaked, count, error } = await hibp.isPasswordLeaked(password);
if (leaked) alert(`This password has appeared in ${count} data breaches.`);
```

K-anonymity API: we SHA-1 the password client-side, send only the first 5 hex chars to `https://api.pwnedpasswords.com/range/…`, and match the remaining bytes locally. The full password never leaves the browser.

**Fail-open by construction**: network errors return `{ leaked: false, error: 'network' }` instead of throwing. HIBP going down must never block your users from signing up. The async Signal Forms `hibpPassword` rule respects this — network errors produce no validation error.

### 8. `SensitiveClipboardService` — verified auto-clear

```typescript
await sensitiveClipboard.copy(apiKey, { clearAfterMs: 15_000 });
```

Password-manager semantics: the service reads the clipboard before clearing and only clears when the content still matches what was copied. If the user copied something else in the meantime, we never overwrite it. Default 15-second clear, configurable. Read permission denial degrades gracefully — the clear is skipped with a `'read-denied'` status.

## Design decisions, briefly

**Two sub-entries, not one "forms" bundle.** Signal Forms adds ~90 kB to the bundle once you pull it. Reactive Forms consumers would pay that cost for nothing. Splitting the sub-entries means each user only ships what they use.

**Main entry has zero dependency on `@angular/forms`.** Validators live in sub-entries; the package root is forms-agnostic. Confirmed by build output inspection.

**`hibpPassword` is async only in Signal Forms.** Reactive Forms has `AsyncValidatorFn` but the ergonomics for debouncing and cancellation are worse. The Reactive `strongPassword` validator is intentionally sync (entropy only) — call `HibpService` manually on submit or via a separate async validator if you need it there.

**Signal Forms rules use `inject()` inside the resource factory.** No provider registration for the validators themselves. The `hibpPassword` rule reaches for `HibpService` from the component injector at validation time, so consumers configure `provideHibp()` once at bootstrap and forget about it.

**Fail-open is a policy, not a bug.** HIBP outages, clipboard permission denials, rate-limiter unknown keys, unsupported environments — all of these return non-blocking outcomes. The rule is: security features must never degrade UX when the underlying capability is missing.

## What's NOT in this release

Kept scope honest by deferring:

- **TOTP (RFC 6238)**: trivial given we now have HMAC, but deserves to ship alongside WebAuthn.
- **WebAuthn / passkeys**: larger surface, separate SDD.
- **CSP nonce / `provideCspMeta()`**: SSR/CSP integration warrants its own design.
- **Signal-based adapters for existing services**: `passwordStrength.asSignal(...)` et al.
- **Key rotation for `SecureStorage`**.
- **`provideSecurityTesting()` with in-memory fakes.**
- **Server-side JWT verification**: out of scope by design — client library.

## How to adopt

```bash
npm i @angular-helpers/security@21.3.0
```

Nothing breaks for existing consumers. Every new service is gated behind a `SecurityConfig` flag (`enableJwt`, `enableCsrf`, `enableRateLimiter`, `enableHibp`, `enableSensitiveClipboard`) defaulting to `false`, plus a matching `provideJwt()`, `provideCsrf()`, etc. for granular setups. The two sub-entries are independently importable:

```typescript
// Reactive Forms
import { SecurityValidators } from '@angular-helpers/security/forms';

// Signal Forms (Angular v21+)
import { strongPassword, hibpPassword } from '@angular-helpers/security/signal-forms';
```

The demos at `/demo/security-utilities` and `/demo/security-signal-forms` walk through every utility interactively — worth a look before wiring your own.

---

Next iterations will tackle WebAuthn, TOTP, and testing helpers. If you hit a rough edge or have a concrete gap in mind, open an issue.
