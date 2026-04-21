[Leer en Español](./README.es.md)

🌐 **Documentation & Demo**: https://gaspar1992.github.io/angular-helpers/

# Angular Security Helpers

Security package for Angular applications that prevents common attacks like ReDoS (Regular Expression Denial of Service) using Web Workers for safe execution.

## 🛡️ Features

### **ReDoS Prevention**

- **Web Worker Execution**: Regular expressions are executed in a separate thread.
- **Configurable Timeout**: Prevents infinite executions.
- **Complexity Analysis**: Detects dangerous patterns before execution.
- **Safe Mode**: Only allows patterns verified as safe.

### **Web Crypto API**

- **Encryption/Decryption**: AES-GCM support for secure data handling
- **Hashing**: SHA-256 and other algorithms
- **HMAC Signing**: HMAC-SHA-256/384/512 for message authentication
- **Key Management**: Generate, import, and export cryptographic keys
- **Secure Random**: Cryptographically secure random values
- **UUID Generation**: RFC4122 v4 UUIDs

### **Secure Storage**

- **Transparent Encryption**: AES-GCM encrypted localStorage/sessionStorage
- **Ephemeral Mode**: In-memory keys for single-session security
- **Passphrase Mode**: PBKDF2-derived keys for cross-session persistence
- **Namespace Isolation**: Organize stored data with prefixes

### **Input Sanitization**

- **XSS Prevention**: Strip dangerous tags and attributes from HTML
- **URL Validation**: Allow only http/https schemes
- **HTML Escaping**: Safe interpolation of user content
- **JSON Safety**: Safe parsing without eval

### **Password Strength**

- **Entropy-Based Scoring**: 0-4 score with labeled strength levels
- **Pattern Detection**: Detects sequences, repetitions, keyboard walks
- **Common Password Check**: Blocks frequently used passwords
- **Feedback Messages**: Actionable improvement suggestions

### **Forms Validators (sub-entries)**

- **`@angular-helpers/security/forms`**: Reactive Forms bridge — `SecurityValidators.strongPassword`, `safeHtml`, `safeUrl`, `noScriptInjection`, `noSqlInjectionHints`.
- **`@angular-helpers/security/signal-forms`**: Angular v21 Signal Forms bridge — `strongPassword`, `safeHtml`, `safeUrl`, `noScriptInjection`, `noSqlInjectionHints`, and async `hibpPassword`.
- **Shared core**: both paradigms delegate to the same pure helpers for guaranteed behavioural parity.

### **JWT Inspection**

- **Client-side decode**: `decode`, `claim`, `isExpired`, `expiresIn`.
- **Explicit non-verifying**: signature validation must happen server-side.

### **CSRF Protection**

- **`CsrfService`**: double-submit token helper backed by `WebCryptoService.generateRandomBytes`.
- **`withCsrfHeader()`**: functional HTTP interceptor that injects the token on POST/PUT/PATCH/DELETE.

### **Rate Limiter**

- **Token-bucket** and **sliding-window** policies.
- **Signal-based state**: `canExecute(key)`, `remaining(key)` return `Signal<T>`.

### **HIBP Leaked-Password Check**

- **k-anonymity**: only the first 5 hex chars of SHA-1 leave the browser.
- **Fail-open**: network errors never block form submissions.

### **Sensitive Clipboard**

- **Verified auto-clear**: reads back the clipboard before clearing to avoid clobbering unrelated content.
- **Password-manager semantics**: default 15-second clear, configurable.

### **Builder Pattern**

- **Fluent API**: Intuitively build regular expressions.
- **Method Chaining**: `.pattern().group().quantifier()`
- **Real-time Validation**: Security analysis during construction.

## 📦 Installation

```bash
npm install @angular-helpers/security
```

## 🚀 Basic Usage

### **Configuration**

```typescript
import { provideSecurity } from '@angular-helpers/security';

bootstrapApplication(AppComponent, {
  providers: [
    provideSecurity({
      // Core services (enabled by default)
      enableRegexSecurity: true,
      enableWebCrypto: true,

      // New services (opt-in, disabled by default)
      enableSecureStorage: true,
      enableInputSanitizer: true,
      enablePasswordStrength: true,

      // Global settings
      defaultTimeout: 5000,
      safeMode: false,
    }),
  ],
});
```

### **Individual Providers**

```typescript
import {
  provideRegexSecurity,
  provideWebCrypto,
  provideSecureStorage,
  provideInputSanitizer,
  providePasswordStrength,
} from '@angular-helpers/security';

// Use only the services you need
bootstrapApplication(AppComponent, {
  providers: [
    provideSecureStorage({ storage: 'session', pbkdf2Iterations: 600_000 }),
    provideInputSanitizer({ allowedTags: ['b', 'i', 'em', 'strong'] }),
    providePasswordStrength(),
  ],
});
```

### **Service Injection**

```typescript
import { RegexSecurityService, inject } from '@angular-helpers/security';

@Component({...})
export class MyComponent {
  private regexSecurity = inject(RegexSecurityService);
}
```

## 📖 Usage Examples

### **1. Basic Regular Expression Test**

```typescript
async testEmail(email: string): Promise<boolean> {
  const result = await this.regexSecurity.testRegex(
    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    email,
    { timeout: 3000 }
  );

  return result.match;
}
```

### **2. Builder Pattern**

```typescript
import { RegexSecurityService } from '@angular-helpers/security';

// Fluent regular expression construction
const { pattern, security } = RegexSecurityService.builder()
  .startOfLine()
  .characterSet('a-zA-Z0-9._%+-')
  .quantifier('+')
  .append('@')
  .characterSet('a-zA-Z0-9.-')
  .quantifier('+')
  .append('\\.')
  .characterSet('a-zA-Z')
  .quantifier('{2,}')
  .endOfLine()
  .timeout(5000)
  .safeMode()
  .build();

// Direct execution
const result = await RegexSecurityService.builder()
  .pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
  .timeout(3000)
  .execute(email, this.regexSecurity);
```

### **3. Security Analysis**

```typescript
async analyzePattern(pattern: string): Promise<void> {
  const analysis = await this.regexSecurity.analyzePatternSecurity(pattern);

  if (!analysis.safe) {
    console.warn('⚠️ Pattern not safe:', analysis.warnings);
    console.info('💡 Recommendations:', analysis.recommendations);

    if (analysis.risk === 'critical') {
      throw new Error('Pattern rejected due to critical security risk');
    }
  }

  console.log(`✅ Pattern complexity: ${analysis.complexity}`);
  console.log(`🎯 Risk level: ${analysis.risk}`);
}
```

### **4. Form Validation**

```typescript
@Component({...})
export class FormValidationComponent {
  constructor(private regexSecurity: RegexSecurityService) {}

  async validateUsername(username: string): Promise<boolean> {
    const result = await this.regexSecurity.testRegex(
      '^[a-zA-Z0-9_]{3,20}$',
      username,
      { timeout: 1000, safeMode: true }
    );

    if (result.timeout) {
      throw new Error('Username validation timeout - possible ReDoS attack');
    }

    if (result.error) {
      console.error('Validation error:', result.error);
      return false;
    }

    return result.match;
  }

  async validateComplexInput(input: string): Promise<boolean> {
    // Builder pattern for complex validation
    const result = await RegexSecurityService
      .builder()
      .startOfLine()
      .nonCapturingGroup('[a-zA-Z]') // First letter
      .characterSet('a-zA-Z0-9_') // Allowed characters
      .quantifier('{2,19}') // Between 3 and 20 characters total
      .endOfLine()
      .timeout(2000)
      .execute(input, this.regexSecurity);

    return result.match;
  }
}
```

### **WebCryptoService**

```typescript
import { WebCryptoService } from '@angular-helpers/security';

export class SecureStorageComponent {
  private cryptoService = inject(WebCryptoService);

  async hashPassword(password: string): Promise<string> {
    return await this.cryptoService.hash(password, 'SHA-256');
  }

  async encryptData(
    data: string,
  ): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array; key: CryptoKey }> {
    const key = await this.cryptoService.generateAesKey(256);
    const { ciphertext, iv } = await this.cryptoService.encryptAes(key, data);
    return { ciphertext, iv, key };
  }

  async decryptData(ciphertext: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> {
    return await this.cryptoService.decryptAes(key, ciphertext, iv);
  }

  async exportKeyForStorage(key: CryptoKey): Promise<JsonWebKey> {
    return await this.cryptoService.exportKey(key);
  }

  async importKeyFromStorage(jwk: JsonWebKey): Promise<CryptoKey> {
    return await this.cryptoService.importAesKey(jwk);
  }

  generateSecureToken(length: number = 32): string {
    const bytes = this.cryptoService.generateRandomBytes(length);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  generateUUID(): string {
    return this.cryptoService.randomUUID();
  }

  async signAndVerify(data: string): Promise<boolean> {
    // Generate HMAC key for SHA-256
    const key = await this.cryptoService.generateHmacKey('HMAC-SHA-256');

    // Sign the data
    const signature = await this.cryptoService.sign(key, data);

    // Verify the signature
    return await this.cryptoService.verify(key, data, signature);
  }
}
```

### **SecureStorageService**

```typescript
import { SecureStorageService } from '@angular-helpers/security';

export class UserSettingsComponent {
  private storage = inject(SecureStorageService);

  async saveUserToken(token: string): Promise<void> {
    // Ephemeral mode (default): data survives only this session
    await this.storage.set('authToken', { token, createdAt: Date.now() });
  }

  async getUserToken(): Promise<{ token: string; createdAt: number } | null> {
    return await this.storage.get<{ token: string; createdAt: number }>('authToken');
  }

  async initWithPassphrase(passphrase: string): Promise<void> {
    // Passphrase mode: data survives page reloads
    await this.storage.initWithPassphrase(passphrase);
  }

  async saveWithNamespace(userId: string, data: unknown): Promise<void> {
    // Namespace isolation
    await this.storage.set('profile', data, `user:${userId}`);
  }

  clearUserData(userId: string): void {
    // Clear only this user's data
    this.storage.clear(`user:${userId}`);
  }
}
```

### **InputSanitizerService**

```typescript
import { InputSanitizerService } from '@angular-helpers/security';

export class CommentComponent {
  private sanitizer = inject(InputSanitizerService);

  sanitizeUserComment(html: string): string {
    // Strip dangerous tags, keep safe ones (b, i, em, a, etc.)
    return this.sanitizer.sanitizeHtml(html);
    // Example: '<b>Hello</b><script>alert(1)</script>' → '<b>Hello</b>'
  }

  validateUserLink(url: string): string | null {
    // Only allow http/https URLs
    return this.sanitizer.sanitizeUrl(url);
    // Example: 'javascript:alert(1)' → null
    // Example: 'https://example.com' → 'https://example.com/'
  }

  escapeForDisplay(text: string): string {
    // Safe for HTML text nodes
    return this.sanitizer.escapeHtml(text);
    // Example: '<b>hello</b>' → '&lt;b&gt;hello&lt;/b&gt;'
  }

  parseUserJson(json: string): unknown | null {
    // Safe JSON parsing without eval
    return this.sanitizer.sanitizeJson(json);
  }
}
```

### **PasswordStrengthService**

```typescript
import { PasswordStrengthService } from '@angular-helpers/security';

export class RegistrationComponent {
  private passwordStrength = inject(PasswordStrengthService);

  checkPasswordStrength(password: string): void {
    const result = this.passwordStrength.assess(password);

    console.log(`Score: ${result.score}/4`); // 0-4
    console.log(`Label: ${result.label}`); // 'very-weak' to 'very-strong'
    console.log(`Entropy: ${result.entropy} bits`); // calculated entropy
    console.log('Feedback:', result.feedback); // improvement suggestions

    // Example results:
    // 'password' → score: 0, label: 'very-weak', feedback: ['This is a commonly used password']
    // 'P@ssw0rd!' → score: 2, label: 'fair', feedback: ['Avoid keyboard patterns']
    // 'xK#9mZ$vLq2@rBnT7' → score: 4, label: 'very-strong', feedback: []
  }
}
```

### **SecurityValidators (Reactive Forms)**

```typescript
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SecurityValidators } from '@angular-helpers/security/forms';

export class SignupFormComponent {
  form = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      SecurityValidators.strongPassword({ minScore: 3 }),
    ]),
    bio: new FormControl('', [SecurityValidators.safeHtml()]),
    homepage: new FormControl('', [SecurityValidators.safeUrl({ schemes: ['https:'] })]),
    query: new FormControl('', [
      SecurityValidators.noScriptInjection(),
      SecurityValidators.noSqlInjectionHints(),
    ]),
  });
}
```

The validators are static factory functions — no provider registration required. They delegate to
shared pure helpers, so the Signal Forms variant below produces equivalent results for the same input.

### **Signal Forms validators**

```typescript
import { signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import {
  strongPassword,
  hibpPassword,
  safeHtml,
  safeUrl,
} from '@angular-helpers/security/signal-forms';

export class SignupSignalFormsComponent {
  model = signal({ email: '', password: '', bio: '', homepage: '' });

  f = form(this.model, (p) => {
    required(p.email);
    required(p.password);
    strongPassword(p.password, { minScore: 3 });
    hibpPassword(p.password); // async — calls HIBP via validateAsync
    safeHtml(p.bio);
    safeUrl(p.homepage, { schemes: ['https:'] });
  });
}
```

**Sub-entry requirement**: ensure `@angular/forms` is installed. The main entry has zero runtime
dependency on `@angular/forms`; only the sub-entries need it.

**Async HIBP rule**: `hibpPassword` requires `provideHibp()` in the injector hierarchy. The rule
fails open — network errors never block form submission.

### **JwtService**

```typescript
import { JwtService } from '@angular-helpers/security';

export class SessionGuard {
  private jwt = inject(JwtService);

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    return !this.jwt.isExpired(token, /* leewaySeconds */ 30);
  }

  currentUserId(): string | null {
    const token = localStorage.getItem('access_token');
    return token ? this.jwt.claim<string>(token, 'sub') : null;
  }
}
```

> **Security note**: `JwtService` decodes payloads for client-side inspection only. **Never** trust
> the decoded contents for authorization decisions — signature verification must happen server-side.

### **CsrfService + `withCsrfHeader()`**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideSecurity, CsrfService, withCsrfHeader } from '@angular-helpers/security';

bootstrapApplication(App, {
  providers: [
    provideSecurity({ enableCsrf: true }),
    provideHttpClient(withInterceptors([withCsrfHeader()])),
  ],
});

// After login:
const csrf = inject(CsrfService);
csrf.storeToken(response.csrfToken);
// Subsequent POST/PUT/PATCH/DELETE requests automatically carry X-CSRF-Token.
```

### **RateLimiterService**

```typescript
import { RateLimiterService, RateLimitExceededError } from '@angular-helpers/security';

export class SearchComponent {
  private rateLimiter = inject(RateLimiterService);

  constructor() {
    this.rateLimiter.configure('search', {
      type: 'token-bucket',
      capacity: 5,
      refillPerSecond: 1,
    });
  }

  canSearch = this.rateLimiter.canExecute('search'); // Signal<boolean>
  remaining = this.rateLimiter.remaining('search'); // Signal<number>

  async search(query: string) {
    try {
      await this.rateLimiter.consume('search');
      return this.api.search(query);
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        // Show countdown using err.retryAfterMs
      }
    }
  }
}
```

### **HibpService**

```typescript
import { HibpService } from '@angular-helpers/security';

export class RegistrationComponent {
  private hibp = inject(HibpService);

  async checkPassword(password: string) {
    const { leaked, count, error } = await this.hibp.isPasswordLeaked(password);
    if (error) return; // fail-open on network failures
    if (leaked) alert(`This password has appeared in ${count} data breaches.`);
  }
}
```

### **SensitiveClipboardService**

```typescript
import { SensitiveClipboardService } from '@angular-helpers/security';

export class ApiKeyPanel {
  private sensitiveClipboard = inject(SensitiveClipboardService);

  async copy(value: string) {
    await this.sensitiveClipboard.copy(value, { clearAfterMs: 15_000 });
  }
}
```

The service reads the clipboard before clearing and skips the clear if the content no longer
matches what was copied — so third-party copies by the user are never overwritten.

## 🔧 Advanced Configuration

### **Security Options**

```typescript
interface RegexSecurityConfig {
  timeout?: number; // Timeout in ms (default: 5000)
  maxComplexity?: number; // Max complexity (default: 10)
  allowBacktracking?: boolean; // Allow backtracking (default: false)
  safeMode?: boolean; // Safe mode (default: false)
}
```

### **Builder Options**

```typescript
interface RegexBuilderOptions {
  global?: boolean; // 'g' flag
  ignoreCase?: boolean; // 'i' flag
  multiline?: boolean; // 'm' flag
  dotAll?: boolean; // 's' flag
  unicode?: boolean; // 'u' flag
  sticky?: boolean; // 'y' flag
}
```

## 🛡️ Security Features

### **Dangerous Pattern Detection**

The service automatically detects:

- **Nested quantifiers**: `**`, `++` (catastrophic backtracking)
- **Lookaheads/lookbehinds**: `(?=)`, `(?!)`, `(?<=)`, `(?<!)`
- **Atomic groups**: `(?>)`
- **Recursive patterns**: Deeply nested groups
- **Complex quantifiers**: `{n,m}` with high values
- **Greedy wildcards**: `.*`, `.+` with variable characters

### **Risk Levels**

- **🟢 Low**: Simple and safe patterns
- **🟡 Medium**: Patterns with lookahead/lookbehind
- **🟠 High**: Patterns with complex quantifiers
- **🔴 Critical**: Patterns with catastrophic backtracking

### **Attack Prevention**

- **Timeout**: Stops execution after the time limit
- **Web Worker**: Isolates execution from the main thread
- **Pre-analysis**: Rejects dangerous patterns before execution
- **Match limit**: Prevents infinite loops

## 📊 Metrics and Monitoring

### **Execution Results**

```typescript
interface RegexTestResult {
  match: boolean; // If there was a match
  matches?: RegExpMatchArray[]; // All matches found
  groups?: { [key: string]: string }; // Captured groups
  executionTime: number; // Execution time in ms
  timeout: boolean; // If there was a timeout
  error?: string; // Error if one occurred
}
```

### **Security Analysis**

```typescript
interface RegexSecurityResult {
  safe: boolean; // If the pattern is safe
  complexity: number; // Complexity level (0-∞)
  risk: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[]; // Security warnings
  recommendations: string[]; // Improvement recommendations
}
```

## 🔄 Form Integration

### **Angular Validators**

```typescript
import { AbstractControl, ValidationErrors } from '@angular/forms';

export class SecurityValidators {
  constructor(private regexSecurity: RegexSecurityService) {}

  async securePattern(pattern: string, config?: RegexSecurityConfig) {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      const value = control.value;

      if (!value) return null;

      try {
        const result = await this.regexSecurity.testRegex(pattern, value, config);

        if (!result.match) {
          return { securePattern: { value, reason: 'Pattern does not match' } };
        }

        if (result.timeout) {
          return { securePattern: { value, reason: 'Pattern execution timeout' } };
        }

        return null;
      } catch (error) {
        return { securePattern: { value, reason: (error as Error).message } };
      }
    };
  }
}
```

### **Usage in Template Forms**

```typescript
@Component({...})
export class SecureFormComponent {
  private regexSecurity = inject(RegexSecurityService);
  private securityValidators = inject(SecurityValidators);

  emailValidator = this.securityValidators.securePattern(
    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    { timeout: 3000, safeMode: true }
  );
}
```

## 🚨 Best Practices

### **1. Use Safe Mode in Production**

```typescript
// In production, always use safeMode
const config = { safeMode: true, timeout: 3000 };
```

### **2. Appropriate Timeout**

```typescript
// For form validations: 1-3 seconds
// For text processing: 5-10 seconds
// Never more than 30 seconds
```

### **3. Pre-analysis**

```typescript
// Always analyze user-provided patterns
const analysis = await this.regexSecurity.analyzePatternSecurity(pattern);
if (!analysis.safe) {
  // Consider using a safer alternative pattern
}
```

### **4. Error Handling**

```typescript
try {
  const result = await this.regexSecurity.testRegex(pattern, text, config);
  // Process result
} catch (error) {
  // Handle error safely
  console.error('Regex security error:', error);
  // Fallback to a simpler validation
}
```

## 🔍 Debugging

### **Security Logging**

The service includes automatic logging:

```typescript
// Enables detailed logging
console.log('Regex security initialized');
console.log('Pattern analysis completed:', analysis);
console.log('Pattern execution completed:', result);
```

### **Performance Monitoring**

```typescript
// Monitor execution times
if (result.executionTime > 1000) {
  console.warn('Slow regex pattern:', pattern, result.executionTime + 'ms');
}
```

## 📝 License

MIT License - see the LICENSE file for details.

## 🤝 Contributions

Contributions are welcome. Please:

1. Create an issue to discuss changes
2. Fork the repository
3. Create a feature branch
4. Send a pull request

## 📚 Additional Resources

- [OWASP Regular Expression Denial of Service](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Angular Security Best Practices](https://angular.io/guide/security)

---

**⚠️ Warning**: This package helps prevent ReDoS but does not replace other security practices. Always validate and sanitize user inputs.
