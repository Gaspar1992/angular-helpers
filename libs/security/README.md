# 🛡️ @angular-helpers/security

Tree-shakable client-side security suite for Angular 22+ — ReDoS-safe Web Worker regexes, WebCrypto AES-GCM/HMAC, encrypted storage, XSS sanitization, rate limiting, session idle tracking, and Signal/Reactive Forms validators.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/security
```

### 2. Tree-Shakable Provider Setup

Import only the security features your app needs using `with*()` helpers:

```typescript
import { ApplicationConfig } from '@angular/core';
import {
  provideSecurity,
  withWebCrypto,
  withInputSanitizer,
  withRateLimiter,
  withSessionIdle,
} from '@angular-helpers/security';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSecurity(
      withWebCrypto(),
      withInputSanitizer(),
      withRateLimiter({
        defaults: {
          login: { type: 'sliding-window', max: 5, windowMs: 60_000 },
        },
      }),
      withSessionIdle(),
    ),
  ],
};
```

### 3. Signal-First Component Usage

```typescript
import { Component } from '@angular/core';
import { injectRateLimiter, injectSessionIdle } from '@angular-helpers/security';

@Component({
  selector: 'app-login-guard',
  template: `
    <p>Attempts left: {{ limiter.remaining('login')() }}</p>
    @if (idle.isWarning()) {
      <p>Session expiring soon!</p>
    }
  `,
})
export class LoginGuardComponent {
  readonly limiter = injectRateLimiter();
  readonly idle = injectSessionIdle({ timeoutMs: 300_000, warningThresholdMs: 30_000 });
}
```

---

## Core Primitives

| Primitive / Entry Point                  | Domain                | Description                                                                                        |
| :--------------------------------------- | :-------------------- | :------------------------------------------------------------------------------------------------- |
| `provideSecurity(...features)`           | **DI / Tree-Shaking** | Registers only selected `with*()` security capabilities.                                           |
| `injectRateLimiter()`                    | **Throttling**        | Signal-first sliding-window / token-bucket rate limiter (`tryConsume`, `remaining`, `canExecute`). |
| `injectSessionIdle()`                    | **Session**           | Zoneless idle & warning signal monitor with automatic `DestroyRef` cleanup.                        |
| `RegexSecurityService`                   | **ReDoS Defense**     | Evaluates regex patterns in an isolated Web Worker with timeout protection.                        |
| `WebCryptoService`                       | **Cryptography**      | Native AES-GCM encryption, SHA-256 hashing, and HMAC signing.                                      |
| `InputSanitizerService`                  | **XSS Defense**       | Allowlist HTML/URL sanitization.                                                                   |
| `PasswordStrengthService`                | **Auth**              | NIST-aligned entropy scoring and breach checks (`HibpService`).                                    |
| `@angular-helpers/security/forms`        | **Reactive Forms**    | `SecurityValidators` (`strongPassword`, `safeHtml`, `safeUrl`).                                    |
| `@angular-helpers/security/signal-forms` | **Signal Forms**      | Native Angular Signal Forms validators including async HIBP checks.                                |

---

## Interactive Documentation & Demo

👉 **[Security Docs](https://gaspar1992.github.io/angular-helpers/docs/security)**
👉 **[Security Live Demo](https://gaspar1992.github.io/angular-helpers/demo/security)**

## License

MIT
