# Specification: worker-http Phase 2 — P2 (Serializer) + P4 (Interceptors)

> Date: 2026-04-06
> Status: Draft
> Parent proposal: .sdd/proposal.md

## Domain: off-main-thread HTTP — worker serialization and interceptor pipeline

---

## Feature 1: SecureStorageService

### Functional Requirements

#### REQ-SS-01: Encrypted write

- GIVEN a caller calls `set(key, value)`
- WHEN the service serializes `value` to JSON and encrypts with AES-GCM
- THEN the resulting base64-encoded ciphertext is stored under `key` in the target storage

#### REQ-SS-02: Transparent read

- GIVEN a caller calls `get<T>(key)`
- WHEN the service retrieves the ciphertext, decrypts, and deserializes
- THEN it returns the original typed value, or `null` if the key does not exist

#### REQ-SS-03: Key modes

- The service MUST support two key modes:
  - **Ephemeral** (default): a `CryptoKey` is generated once per service instance (in-memory only); data is unrecoverable after page reload
  - **Passphrase-derived**: caller provides a passphrase; key is derived via `PBKDF2` (600,000 iterations, SHA-256, 256-bit output) using a stored salt

#### REQ-SS-04: Namespace isolation

- `set(key, value, namespace?)` / `get(key, namespace?)` / `remove(key, namespace?)` / `clear(namespace?)`
- When a namespace is provided, the storage key is prefixed as `{namespace}:{key}`
- `clear(namespace)` removes only keys belonging to that namespace

#### REQ-SS-05: SSR guard

- `isSupported()` MUST return `false` on non-browser platforms
- All read/write methods MUST throw a descriptive error if called when `isSupported()` is `false`

#### REQ-SS-06: Storage target

- Constructor/inject-time config selects `localStorage` (default) or `sessionStorage`

### Non-functional Requirements

- PBKDF2 iteration count: minimum 600,000 (configurable upward, not downward)
- AES-GCM IV: fresh 12-byte random IV per write (never reuse)
- No plaintext key material stored in storage

### Edge Cases

- Calling `get()` on a key that was written without encryption (pre-migration) → return `null`, never throw
- Calling `set()` with `undefined` value → throw `TypeError`
- Storage quota exceeded → propagate `DOMException` with `QuotaExceededError`
- Corrupted ciphertext → `get()` returns `null` (never throws to the caller)

### Acceptance Criteria

- [ ] Roundtrip test: `set(key, obj)` → `get<T>(key)` returns deep-equal `obj`
- [ ] Ephemeral mode: a new service instance cannot read data written by a previous instance
- [ ] Passphrase mode: same passphrase + salt → same key → readable across instances
- [ ] `clear(namespace)` removes only namespaced keys, not all storage
- [ ] `isSupported()` returns `false` in SSR environment

---

## Feature 2: HMAC Signing on WebCryptoService

### Functional Requirements

#### REQ-HMAC-01: Key generation

- `generateHmacKey(algorithm: HmacAlgorithm): Promise<CryptoKey>`
- Supported algorithms: `'HMAC-SHA-256' | 'HMAC-SHA-384' | 'HMAC-SHA-512'`
- Returns an extractable `CryptoKey` with `['sign', 'verify']` usages

#### REQ-HMAC-02: Sign

- `sign(key: CryptoKey, data: string | ArrayBuffer): Promise<string>`
- Returns hex-encoded signature (consistent with existing `hash()` output format)

#### REQ-HMAC-03: Verify

- `verify(key: CryptoKey, data: string | ArrayBuffer, signature: string): Promise<boolean>`
- Accepts hex-encoded signature (same format as `sign()` output)
- Returns `true` only if the signature is cryptographically valid

#### REQ-HMAC-04: Key export/import compatibility

- Existing `exportKey()` and `importAesKey()` do NOT cover HMAC keys
- Add `importHmacKey(jwk: JsonWebKey, algorithm: HmacAlgorithm): Promise<CryptoKey>`

### Non-functional Requirements

- All HMAC methods MUST call `ensureSecureContext()` (existing pattern in `WebCryptoService`)
- Methods are added to the existing `WebCryptoService` class — no new service/provider needed

### Edge Cases

- Passing an AES key to `sign()` → propagate the `DOMException` from SubtleCrypto unchanged
- Empty string data → valid input; must not throw
- Malformed hex in `verify()` → return `false` (never throw)

### Acceptance Criteria

- [ ] `sign()` + `verify()` roundtrip with the same key returns `true`
- [ ] `verify()` with a different key returns `false`
- [ ] `verify()` with tampered data returns `false`
- [ ] `importHmacKey(exportKey(key))` produces a key that can verify existing signatures

---

## Feature 3: InputSanitizerService

### Functional Requirements

#### REQ-IS-01: HTML sanitization

- `sanitizeHtml(input: string): string`
- Parses input via `DOMParser` as `text/html`
- Removes all elements not in a configurable allowlist (default safe subset: `b`, `i`, `em`, `strong`, `a[href]`, `p`, `br`, `ul`, `ol`, `li`, `span`)
- Strips all event handler attributes (`on*`)
- Strips `javascript:` and `data:` href values
- Does NOT use `innerHTML` assignment for parsing (avoids script execution side effects)

#### REQ-IS-02: URL sanitization

- `sanitizeUrl(input: string): string | null`
- Validates input via the `URL` constructor
- Returns the normalized URL string only if scheme is `http:` or `https:`
- Returns `null` for `javascript:`, `data:`, `vbscript:`, relative URLs, or malformed strings

#### REQ-IS-03: HTML escaping

- `escapeHtml(input: string): string`
- Replaces: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#x27;`
- Suitable for safe interpolation of user content into HTML text nodes

#### REQ-IS-04: JSON sanitization

- `sanitizeJson(input: string): unknown | null`
- Wraps `JSON.parse` in a try/catch
- Returns the parsed value on success, `null` on any error
- Does NOT evaluate input as code (no `eval`, no `Function`)

### Non-functional Requirements

- Stateless service: no constructor side effects, no worker, no async initialization
- `sanitizeHtml` allowlist MUST be configurable at injection time via a `SANITIZER_CONFIG` injection token with safe defaults
- Methods are synchronous (no `Promise`)

### Edge Cases

- `sanitizeHtml('')` → `''`
- `sanitizeHtml('<script>alert(1)</script>')` → `''` (script tag removed entirely)
- `sanitizeUrl('javascript:alert(1)')` → `null`
- `sanitizeUrl('')` → `null`
- `sanitizeJson('undefined')` → `null`
- `escapeHtml('<b>hello</b>')` → `'&lt;b&gt;hello&lt;/b&gt;'`

### Acceptance Criteria

- [ ] `sanitizeHtml` removes `<script>`, `<iframe>`, `<object>`, `onerror` attributes
- [ ] `sanitizeHtml` preserves allowed tags from the default allowlist
- [ ] `sanitizeUrl` accepts `https://example.com`, rejects `javascript:`, `data:text/html`, and empty string
- [ ] `escapeHtml` escapes all 5 special characters
- [ ] `sanitizeJson` returns `null` for non-JSON strings and valid objects for valid JSON

---

## Feature 4: PasswordStrengthService

### Functional Requirements

#### REQ-PS-01: Strength assessment

- `assess(password: string): PasswordStrengthResult`
- Synchronous, pure function (no side effects)

#### REQ-PS-02: PasswordStrengthResult shape

```ts
export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  entropy: number; // bits, float
  feedback: string[]; // human-readable improvement hints
}
```

#### REQ-PS-03: Entropy calculation

- Pool size derived from detected character classes:
  - Lowercase letters: +26
  - Uppercase letters: +26
  - Digits: +10
  - Common symbols (`!@#$%^&*...`): +32
  - Extended/Unicode chars detected: +64
- `entropy = length × log2(poolSize)`

#### REQ-PS-04: Score thresholds

| Score | Label       | Entropy    |
| ----- | ----------- | ---------- |
| 0     | very-weak   | < 28 bits  |
| 1     | weak        | 28–35 bits |
| 2     | fair        | 36–49 bits |
| 3     | strong      | 50–69 bits |
| 4     | very-strong | ≥ 70 bits  |

#### REQ-PS-05: Pattern penalties

- Sequences (3+ consecutive: `abc`, `123`, `xyz`) → feedback hint added, entropy reduced by 20%
- Repetitions (3+ same char: `aaa`) → feedback hint, entropy reduced by 10% per repeat group
- Keyboard walks (`qwerty`, `asdf`, `zxcv`) → feedback hint, entropy reduced by 15%
- Common password dictionary check: `['password', '123456', 'qwerty', 'letmein', 'admin', 'welcome']` → score capped at 1

#### REQ-PS-06: Feedback messages

- Empty password → `['Password cannot be empty']`
- Length < 8 → `['Use at least 8 characters']`
- Missing uppercase → `['Add uppercase letters']`
- Missing digits → `['Add numbers']`
- Missing symbols → `['Add special characters']`
- Sequence detected → `['Avoid predictable sequences (abc, 123)']`
- Repetition detected → `['Avoid repeated characters']`

### Non-functional Requirements

- Zero runtime dependencies — pure TypeScript, no external libs
- Synchronous — trivially wrappable in `computed()` for signal-based forms
- `assess('')` must return `score: 0`, never throw

### Edge Cases

- Single character: entropy calculated correctly, score 0
- All same character (`aaaaaaaa`): repetition penalty applies
- Unicode emoji password: extended pool contributes; length counted in code points, not UTF-16 units
- Password equal to a common password string: score capped at 1 regardless of length

### Acceptance Criteria

- [ ] `assess('password')` → `score: 0` or `1` (common password dictionary match)
- [ ] `assess('P@ssw0rd!')` → `score: 2` or higher
- [ ] `assess('xK#9mZ$vLq2@rBnT7')` → `score: 4`
- [ ] `assess('')` → `score: 0`, feedback includes empty-password message, no throw
- [ ] Sequence `abc123` in password adds the sequence feedback hint

---

## Provider Integration Spec

### REQ-PROV-01: SecurityConfig update

```ts
export interface SecurityConfig {
  enableRegexSecurity?: boolean;
  enableWebCrypto?: boolean;
  enableSecureStorage?: boolean; // NEW
  enableInputSanitizer?: boolean; // NEW
  enablePasswordStrength?: boolean; // NEW
  defaultTimeout?: number;
  safeMode?: boolean;
}
```

### REQ-PROV-02: Individual providers

- `provideSecureStorage(config?: SecureStorageConfig): EnvironmentProviders`
- `provideInputSanitizer(config?: SanitizerConfig): EnvironmentProviders`
- `providePasswordStrength(): EnvironmentProviders`

### REQ-PROV-03: index.ts exports

All new public types, interfaces, and services MUST be exported from `src/index.ts`.

---

## Technical Constraints

- All services follow the established pattern: `@Injectable()` without `providedIn: 'root'`, using explicit `provide*()` functions
- No new `peerDependencies` may be added
- `WebCryptoService` extensions must not break existing callers of `hash()`, `encryptAes()`, `decryptAes()`, `generateAesKey()`, `exportKey()`, `importAesKey()`, `generateRandomBytes()`, `randomUUID()`
- SSR compatibility: all services with DOM/storage dependencies must have `isSupported()` guarded by `isPlatformBrowser()`
- `ChangeDetectionStrategy.OnPush` ergonomics: all methods that are not async must be synchronous (no internal observables/timers that silently defer)

---

## Known Open Questions (from proposal)

1. `SecureStorageService` key rotation API — deferred to v2
2. HMAC on `WebCryptoService` vs new `WebCryptoSigningService` — **decision needed before implementation**
3. `InputSanitizerService` allowlist: configurable via injection token vs hardcoded safe subset — **spec above assumes injection token with safe defaults**
4. `PasswordStrengthService` as fn primitive vs service only — **spec above covers service only; fn wrapper can be added without breaking changes later**
