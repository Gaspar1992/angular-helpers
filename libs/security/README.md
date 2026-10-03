# 🛡️ @angular-helpers/security

A comprehensive client-side security suite for Angular applications — ReDoS prevention via Web Workers, WebCrypto encryption & HMAC signing, encrypted storage, input sanitization, password entropy scoring, and Reactive & Signal Forms validators.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/security
```

### 2. Provider Setup

Configure security capabilities centrally at bootstrap:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSecurity } from '@angular-helpers/security';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSecurity({
      enableRegexSecurity: true,
      enableWebCrypto: true,
      enableSecureStorage: true,
      enableInputSanitizer: true,
      enablePasswordStrength: true,
      enableJwt: true,
    }),
  ],
};
```

### 3. Usage Example

```typescript
import { Component, inject, signal } from '@angular/core';
import {
  RegexSecurityService,
  WebCryptoService,
  PasswordStrengthService,
} from '@angular-helpers/security';

@Component({
  selector: 'app-security-demo',
  template: `
    <input (input)="checkPassword($any($event.target).value)" placeholder="Enter password" />
    <p>Password Strength: {{ strengthScore() }} / 4</p>
  `,
})
export class SecurityDemoComponent {
  private readonly passwordService = inject(PasswordStrengthService);
  readonly strengthScore = signal(0);

  checkPassword(pwd: string) {
    const analysis = this.passwordService.evaluate(pwd);
    this.strengthScore.set(analysis.score);
  }
}
```

---

## Core Primitives

| Service / Entry Point                    | Domain                | Description                                                                                                   |
| :--------------------------------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------ |
| `RegexSecurityService`                   | **ReDoS Defense**     | Executes regex in isolated Web Workers with configurable timeout to prevent catastrophic backtracking.        |
| `WebCryptoService`                       | **Cryptography**      | AES-GCM encryption/decryption, SHA-256 hashing, HMAC signing, and cryptographic UUIDs.                        |
| `SecureStorageService`                   | **Encrypted Storage** | Transparent AES-GCM encrypted `localStorage` / `sessionStorage` with passphrase or ephemeral keys.            |
| `InputSanitizerService`                  | **XSS Prevention**    | Strips dangerous tags, attributes, and scripts from user-supplied HTML and URLs.                              |
| `PasswordStrengthService`                | **Auth Security**     | NIST-compliant entropy scoring (0–4), sequence detection, and common password blocking.                       |
| `JwtInspectorService`                    | **Tokens**            | Client-side JWT payload inspection, claims extraction, and expiration verification without full parser bloat. |
| `RateLimiterService`                     | **Client Throttling** | Sliding-window client-side rate limiting for sensitive operations.                                            |
| `SensitiveClipboardService`              | **Data Protection**   | Auto-clears sensitive copied data (passwords, tokens) from clipboard after a configurable delay.              |
| `@angular-helpers/security/forms`        | **Reactive Forms**    | `SecurityValidators` for Reactive Forms (`strongPassword`, `safeHtml`, `safeUrl`, `noScriptInjection`).       |
| `@angular-helpers/security/signal-forms` | **Signal Forms**      | Native Angular Signal Forms integration with synchronous and async `hibpPassword` validation.                 |

---

## Architecture Guarantees

- **Non-Blocking Crypto & Regex**: Expensive operations are delegated to Web Workers or native browser Crypto API threads, preserving 60fps UI performance.
- **Zoneless Ready**: Built with Angular Signals; no Zone.js dependencies.
- **SSR Safe**: Transparently no-ops or provides safe fallbacks when executing on the server.
- **Zero Heavy Dependencies**: Pure TypeScript and native Web APIs; no external crypto packages bundled.

---

## Interactive Documentation & Demos

Live interactive demonstrations and API guides:
👉 **[Angular Helpers Security Docs](https://gaspar1992.github.io/angular-helpers/docs/security)**
👉 **[Security Utilities Demo](https://gaspar1992.github.io/angular-helpers/demo/security)**

---

## License

MIT
