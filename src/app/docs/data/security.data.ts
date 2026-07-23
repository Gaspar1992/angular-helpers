import type { ServiceDoc } from '../models/doc-meta.model';

export const SECURITY_SERVICES: ServiceDoc[] = [
  {
    id: 'regex-security',
    name: 'RegexSecurityService',
    description:
      'Executes regular expressions safely in a Web Worker to prevent ReDoS (Regular Expression Denial of Service) attacks. Provides timeout protection, complexity analysis, and safe mode enforcement.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: false,
    browserSupport: 'All browsers with Web Workers support',
    notes: [
      'Use safeMode: true in production to block dangerous patterns.',
      'Always handle timeout: true in the result to detect potential attacks.',
      'Pair with RegexSecurityBuilder for complex pattern construction.',
    ],
    methods: [
      {
        name: 'builder',
        signature: 'builder(): RegexSecurityBuilder',
        description: 'Builder pattern to construct safe regular expressions',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'testRegex',
        signature:
          'testRegex(pattern: string, text: string, config: RegexSecurityConfig): Promise<RegexTestResult>',
        description: 'Executes a regular expression safely with a timeout',
        returns: 'Promise<RegexTestResult>',
      },
      {
        name: 'analyzePatternSecurity',
        signature: 'analyzePatternSecurity(pattern: string): Promise<RegexSecurityResult>',
        description: 'Analyzes the security of a regular expression pattern',
        returns: 'Promise<RegexSecurityResult>',
      },
    ],
    example: `import { RegexSecurityService } from '@angular-helpers/security';

@Component({...})
export class ValidationComponent {
  private regexSecurity = inject(RegexSecurityService);

  async validate(email: string): Promise<boolean> {
    const analysis = await this.regexSecurity.analyzePatternSecurity(
      '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    );

    if (!analysis.safe) {
      console.warn('Unsafe pattern:', analysis.warnings);
      return false;
    }

    const result = await this.regexSecurity.testRegex(
      '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      email,
      { timeout: 3000, safeMode: true }
    );

    if (result.timeout) throw new Error('Possible ReDoS attack detected');
    return result.match;
  }
}`,
    guides: [
      {
        title: 'Off-Thread ReDoS-Safe Input Validation',
        description: `This guide details how to leverage RegexSecurityService inside an Angular reactive form to delegate heavy regular expression validations to a background WorkerPool.

This protects your main UI thread (preventing freezing and dropped frames at 60 FPS) and implements strict timeout protections to prevent Regular Expression Denial of Service (ReDoS) vulnerabilities.`,
        files: [
          {
            name: 'secure-validator.component.ts',
            language: 'ts',
            content: `import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegexSecurityService } from '@angular-helpers/security';

@Component({
  selector: 'app-secure-validator',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './secure-validator.component.html'
})
export class SecureValidatorComponent {
  private readonly securityService = inject(RegexSecurityService);
  
  protected readonly isProcessing = signal<boolean>(false);
  protected readonly evaluationResult = signal<any | null>(null);

  protected readonly form = new FormGroup({
    pattern: new FormControl('^(a+)+$', [Validators.required]),
    payload: new FormControl('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!123', [Validators.required])
  });

  async evaluateInput() {
    const val = this.form.value;
    if (!val.pattern || !val.payload) return;

    this.isProcessing.set(true);
    this.evaluationResult.set(null);

    try {
      // 1. Analyze regular expression pattern for structural ReDoS vulnerabilities without executing it
      const analysis = await this.securityService.analyzePatternSecurity(val.pattern);
      
      if (!analysis.safe && analysis.riskLevel === 'high') {
        this.evaluationResult.set({
          safe: false,
          timeout: false,
          executionTime: 0,
          warnings: ['Blocked pattern prior to execution: High ReDoS risk detected.']
        });
        return;
      }

      // 2. Safely execute regex off the main thread inside the background WorkerPool
      // Automatically enforces a strict 2-second timeout, returning 'timeout: true' to prevent event loop hanging.
      const testResult = await this.securityService.testRegex(val.pattern, val.payload, {
        timeout: 2000,
        safeMode: true
      });

      this.evaluationResult.set({
        safe: testResult.match,
        timeout: testResult.timeout,
        executionTime: testResult.executionTime,
        warnings: testResult.timeout ? ['Regular expression took too long to run. Terminated safely.'] : []
      });

    } catch (err: any) {
      this.evaluationResult.set({
        safe: false,
        timeout: false,
        warnings: [err.message || 'Worker runtime execution error']
      });
    } finally {
      this.isProcessing.set(false);
    }
  }
}`,
          },
          {
            name: 'secure-validator.component.html',
            language: 'html',
            content: `<form [formGroup]="form" class="flex flex-col gap-4 max-w-[500px] p-6 bg-base-200/50 backdrop-blur-md rounded-3xl border border-border-subtle shadow-sm">
  <div class="form-control">
    <label class="label">
      <span class="label-text font-bold">Pattern to test (e.g. ^(a+)+$)</span>
    </label>
    <input type="text" class="input input-bordered" formControlName="pattern" />
  </div>

  <div class="form-control">
    <label class="label">
      <span class="label-text font-bold">Text payload</span>
    </label>
    <textarea class="textarea textarea-bordered h-24" formControlName="payload"></textarea>
  </div>

  <button type="button" class="btn btn-primary w-full" 
          [disabled]="form.invalid || isProcessing()" 
          (click)="evaluateInput()">
    {{ isProcessing() ? 'Running in Web Worker...' : 'Run Security Evaluation' }}
  </button>

  @if (evaluationResult(); as res) {
    <div class="alert mt-4 shadow-sm" 
         [class.alert-error]="!res.safe || res.timeout" 
         [class.alert-success]="res.safe && !res.timeout">
      <div>
        <h4 class="font-bold">{{ res.safe ? 'Safe Pattern' : 'ReDoS Risk Detected!' }}</h4>
        <p class="text-sm">
          Execution Time: {{ res.executionTime?.toFixed(2) }}ms | 
          Timeout triggered: {{ res.timeout ? 'YES' : 'NO' }}
        </p>
        @if (res.warnings?.length) {
          <ul class="text-xs list-disc pl-4 mt-2">
            @for (w of res.warnings; track w) {
              <li>{{ w }}</li>
            }
          </ul>
        }
      </div>
    </div>
  }
</form>`,
          },
        ],
      },
    ],
  },
  {
    id: 'regex-security-builder',
    name: 'RegexSecurityBuilder',
    description:
      'Fluent builder for constructing regular expressions with built-in security analysis. Supports method chaining for readable pattern construction. Obtain an instance via RegexSecurityService.builder().',
    scope: 'root',
    importPath: '@angular-helpers/security',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Obtain an instance via RegexSecurityService.builder() — the static builder() method is on the service.',
      'Call build() to get { pattern, options, security }, or execute() to run it directly.',
      'safeMode() in the chain blocks execution if the pattern is unsafe.',
    ],
    methods: [
      {
        name: 'pattern',
        signature: 'pattern(pattern: string): RegexSecurityBuilder',
        description: 'Defines the base pattern',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'append',
        signature: 'append(text: string): RegexSecurityBuilder',
        description: 'Appends text to the current pattern',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'group',
        signature: 'group(content: string, name?: string): RegexSecurityBuilder',
        description: 'Adds a capturing group',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'nonCapturingGroup',
        signature: 'nonCapturingGroup(content: string): RegexSecurityBuilder',
        description: 'Adds a non-capturing group',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'or',
        signature: 'or(alternative: string): RegexSecurityBuilder',
        description: 'Adds an alternative',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'quantifier',
        signature:
          "quantifier(quantifier: '*' | '+' | '?' | '{n}' | '{n,}' | '{n,m}'): RegexSecurityBuilder",
        description: 'Adds a quantifier',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'characterSet',
        signature: 'characterSet(chars: string, negate: any): RegexSecurityBuilder',
        description: 'Adds a character set',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'startOfLine',
        signature: 'startOfLine(): RegexSecurityBuilder',
        description: 'Adds a start of line anchor',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'endOfLine',
        signature: 'endOfLine(): RegexSecurityBuilder',
        description: 'Adds an end of line anchor',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'options',
        signature: 'options(options: RegexBuilderOptions): RegexSecurityBuilder',
        description: 'Configures regular expression options',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'security',
        signature: 'security(config: RegexSecurityConfig): RegexSecurityBuilder',
        description: 'Configures security options',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'timeout',
        signature: 'timeout(ms: number): RegexSecurityBuilder',
        description: 'Configures timeout',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'safeMode',
        signature: 'safeMode(): RegexSecurityBuilder',
        description: 'Activates safe mode',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'build',
        signature:
          'build(): { pattern: string; options: RegexBuilderOptions; security: RegexSecurityConfig }',
        description: 'Builds the final regular expression',
        returns: '{ pattern: string; options: RegexBuilderOptions; security: RegexSecurityConfig }',
      },
      {
        name: 'execute',
        signature: 'execute(text: string, service: RegexSecurityService): Promise<RegexTestResult>',
        description: 'Builds and executes the regular expression',
        returns: 'Promise<RegexTestResult>',
      },
    ],
    example: `import { RegexSecurityService } from '@angular-helpers/security';

@Component({...})
export class PatternComponent {
  private regexSecurity = inject(RegexSecurityService);

  async validateUsername(username: string): Promise<boolean> {
    const result = await RegexSecurityService.builder()
      .startOfLine()
      .characterSet('a-zA-Z')
      .characterSet('a-zA-Z0-9_')
      .quantifier('{2,19}')
      .endOfLine()
      .timeout(2000)
      .safeMode()
      .execute(username, this.regexSecurity);

    return result.match;
  }
}`,
  },
  {
    id: 'web-crypto',
    name: 'WebCryptoService',
    description:
      'Provides cryptographic operations using the Web Crypto API (SubtleCrypto). Supports hashing, AES-GCM encryption/decryption, key generation, key import/export, and secure random generation.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: true,
    browserSupport: 'All modern browsers',
    notes: [
      'Requires a secure context (HTTPS).',
      'All crypto operations are async and return Promises.',
      'Keys are exportable as JWK for persistence or transfer.',
    ],
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'hash',
        signature: 'hash(data: string | ArrayBuffer, algorithm: HashAlgorithm): Promise<string>',
        description: 'Public method hash.',
        returns: 'Promise<string>',
      },
      {
        name: 'generateAesKey',
        signature: 'generateAesKey(length: AesKeyLength): Promise<CryptoKey>',
        description: 'Public method generateAesKey.',
        returns: 'Promise<CryptoKey>',
      },
      {
        name: 'encryptAes',
        signature:
          'encryptAes(key: CryptoKey, data: string | ArrayBuffer): Promise<AesEncryptResult>',
        description: 'Public method encryptAes.',
        returns: 'Promise<AesEncryptResult>',
      },
      {
        name: 'decryptAes',
        signature:
          'decryptAes(key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array<ArrayBuffer>): Promise<string>',
        description: 'Public method decryptAes.',
        returns: 'Promise<string>',
      },
      {
        name: 'exportKey',
        signature: 'exportKey(key: CryptoKey): Promise<JsonWebKey>',
        description: 'Public method exportKey.',
        returns: 'Promise<JsonWebKey>',
      },
      {
        name: 'importAesKey',
        signature: 'importAesKey(jwk: JsonWebKey): Promise<CryptoKey>',
        description: 'Public method importAesKey.',
        returns: 'Promise<CryptoKey>',
      },
      {
        name: 'generateRandomBytes',
        signature: 'generateRandomBytes(length: number): Uint8Array',
        description: 'Public method generateRandomBytes.',
        returns: 'Uint8Array',
      },
      {
        name: 'randomUUID',
        signature: 'randomUUID(): string',
        description: 'Public method randomUUID.',
        returns: 'string',
      },
      {
        name: 'generateHmacKey',
        signature: 'generateHmacKey(algorithm: HmacAlgorithm): Promise<CryptoKey>',
        description: 'Public method generateHmacKey.',
        returns: 'Promise<CryptoKey>',
      },
      {
        name: 'sign',
        signature: 'sign(key: CryptoKey, data: string | ArrayBuffer): Promise<string>',
        description: 'Signs data with an HMAC key. Returns a hex-encoded signature.',
        returns: 'Promise<string>',
      },
      {
        name: 'verify',
        signature:
          'verify(key: CryptoKey, data: string | ArrayBuffer, signature: string): Promise<boolean>',
        description:
          'Verifies an HMAC signature (hex-encoded). Returns false for malformed input — never throws.',
        returns: 'Promise<boolean>',
      },
      {
        name: 'importHmacKey',
        signature: 'importHmacKey(jwk: JsonWebKey, algorithm: HmacAlgorithm): Promise<CryptoKey>',
        description: 'Public method importHmacKey.',
        returns: 'Promise<CryptoKey>',
      },
    ],
    example: `import { WebCryptoService } from '@angular-helpers/security';

@Component({ providers: [WebCryptoService] })
export class CryptoComponent {
  private crypto = inject(WebCryptoService);

  async hashPassword(password: string): Promise<string> {
    return this.crypto.hash(password, 'SHA-256');
  }

  async encryptMessage(message: string): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array; key: JsonWebKey }> {
    const key = await this.crypto.generateAesKey();
    const { ciphertext, iv } = await this.crypto.encryptAes(key, message);
    const exportedKey = await this.crypto.exportKey(key);
    return { ciphertext, iv, key: exportedKey };
  }

  async decryptMessage(ciphertext: ArrayBuffer, iv: Uint8Array, jwk: JsonWebKey): Promise<string> {
    const key = await this.crypto.importAesKey(jwk);
    return this.crypto.decryptAes(key, ciphertext, iv);
  }

  async signAndVerify(data: string): Promise<boolean> {
    const key = await this.crypto.generateHmacKey('HMAC-SHA-256');
    const signature = await this.crypto.sign(key, data);
    return await this.crypto.verify(key, data, signature);
  }
}`,
  },
  {
    id: 'secure-storage',
    name: 'SecureStorageService',
    description:
      'Transparent AES-GCM encrypted storage on top of localStorage/sessionStorage. Supports ephemeral in-memory keys for single-session security or passphrase-derived keys via PBKDF2 for cross-session persistence.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: true,
    browserSupport: 'All modern browsers with Web Crypto API',
    notes: [
      'Requires a secure context (HTTPS) for Web Crypto API.',
      'Ephemeral mode (default): data is lost when the page reloads.',
      'Use initWithPassphrase() for data that must survive page reloads.',
      'PBKDF2 uses 600,000 iterations by default (OWASP 2023 recommendation).',
    ],
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'initWithPassphrase',
        signature: 'initWithPassphrase(passphrase: string, explicitSalt?: string): Promise<void>',
        description: `Initializes the service with a passphrase-derived key (PBKDF2 + AES-GCM).
The salt is automatically persisted in storage on first call and reused on subsequent calls.
Calling this again replaces the active key.`,
        returns: 'Promise<void>',
      },
      {
        name: 'set',
        signature: 'set(key: string, value: T, namespace?: string): Promise<void>',
        description: `Encrypts and stores a value.
A fresh random IV is generated for every write.`,
        returns: 'Promise<void>',
      },
      {
        name: 'get',
        signature: 'get(key: string, namespace?: string): Promise<T | null>',
        description: `Decrypts and returns a stored value.
Returns \`null\` if the key does not exist, was written without encryption,
or the ciphertext is corrupted.`,
        returns: 'Promise<T | null>',
      },
      {
        name: 'remove',
        signature: 'remove(key: string, namespace?: string): void',
        description: 'Removes a single entry from storage.',
        returns: 'void',
      },
      {
        name: 'clear',
        signature: 'clear(namespace?: string): void',
        description: `Clears all entries belonging to a namespace.
When called without arguments, clears the entire storage target.`,
        returns: 'void',
      },
    ],
    example: `import { SecureStorageService } from '@angular-helpers/security';

@Component({...})
export class UserSettingsComponent {
  private storage = inject(SecureStorageService);

  async saveUserToken(token: string): Promise<void> {
    // Ephemeral mode: data survives only this session
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
    await this.storage.set('profile', data, \`user:\${userId}\`);
  }

  clearUserData(userId: string): void {
    // Clear only this user's data
    this.storage.clear(\`user:\${userId}\`);
  }
}`,
  },
  {
    id: 'input-sanitizer',
    name: 'InputSanitizerService',
    description:
      'Structured input sanitization to defend against XSS, URL injection, and unsafe HTML. This is defense-in-depth and does NOT replace a Content Security Policy (CSP).',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: false,
    browserSupport: 'All browsers with DOMParser support',
    notes: [
      'Always configure a proper CSP alongside using this service.',
      'sanitizeHtml uses DOMParser, not innerHTML assignment, to prevent script execution.',
      'Allowed tags and attributes are configurable via SANITIZER_CONFIG injection token.',
    ],
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'sanitizeHtml',
        signature: 'sanitizeHtml(input: string): string',
        description: `Parses and sanitizes an HTML string, keeping only allowed tags and attributes.
Leverages the native browser Sanitizer API (e.g. Element.prototype.setHTML) if available
for high-performance execution, falling back to a custom DOMParser implementation on
unsupported environments (such as older browsers or SSR).`,
        returns: 'string',
      },
      {
        name: 'sanitizeUrl',
        signature: 'sanitizeUrl(input: string): string | null',
        description: `Validates and normalizes a URL string.
Returns the normalized URL only for \`http:\` and \`https:\` schemes.
Returns \`null\` for \`javascript:\`, \`data:\`, \`vbscript:\`, relative URLs, or malformed input.`,
        returns: 'string | null',
      },
      {
        name: 'escapeHtml',
        signature: 'escapeHtml(input: string): string',
        description: `Escapes HTML special characters for safe text interpolation.
Use this when inserting user content into HTML text nodes or attributes.`,
        returns: 'string',
      },
      {
        name: 'sanitizeJson',
        signature: 'sanitizeJson(input: string): unknown | null',
        description: `Safely parses a JSON string. Returns the parsed value on success, \`null\` on any error.
Does NOT use \`eval\` or \`Function\` — uses JSON.parse only.`,
        returns: 'unknown | null',
      },
    ],
    example: `import { InputSanitizerService } from '@angular-helpers/security';

@Component({...})
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
}`,
  },
  {
    id: 'password-strength',
    name: 'PasswordStrengthService',
    description:
      'Entropy-based password strength evaluation. All methods are synchronous and side-effect free — safely wrappable in Angular computed(). Detects sequences, repetitions, keyboard walks, and common passwords.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers (pure TypeScript, no external deps)',
    notes: [
      'Score thresholds: <28 bits=0, <36=1, <50=2, <70=3, >=70=4',
      'Entropy penalties applied for sequences (abc, 123), repetitions (aaa), and keyboard walks (qwerty).',
      'Common passwords (password, 123456, qwerty, etc.) are capped at score 1.',
    ],
    methods: [
      {
        name: 'assess',
        signature: 'assess(password: string): PasswordStrengthResult',
        description: `Evaluates the strength of a password.
Never throws — returns score 0 for empty or null-like input.`,
        returns: 'PasswordStrengthResult',
      },
    ],
    example: `import { PasswordStrengthService } from '@angular-helpers/security';

@Component({...})
export class RegistrationComponent {
  private passwordStrength = inject(PasswordStrengthService);

  checkPasswordStrength(password: string): void {
    const result = this.passwordStrength.assess(password);

    console.log(\`Score: \${result.score}/4\`);        // 0-4
    console.log(\`Label: \${result.label}\`);           // 'very-weak' to 'very-strong'
    console.log(\`Entropy: \${result.entropy} bits\`);  // calculated entropy
    console.log('Feedback:', result.feedback);       // improvement suggestions

    // Example results:
    // 'password' → score: 0, label: 'very-weak', feedback: ['This is a commonly used password']
    // 'P@ssw0rd!' → score: 2, label: 'fair', feedback: ['Avoid keyboard patterns']
    // 'xK#9mZ$vLq2@rBnT7' → score: 4, label: 'very-strong', feedback: []
  }
}`,
  },
  {
    id: 'jwt',
    name: 'JwtService',
    description:
      'Client-side JWT decode and inspection utilities. Explicitly NON-verifying — signature validation must happen server-side. Use for reading expiration, extracting claims for UX, or detecting expired tokens to redirect to login.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: false,
    browserSupport: 'All browsers (pure TypeScript, no external deps)',
    notes: [
      'NEVER use for authorization decisions — verify signatures server-side.',
      'decode() throws InvalidJwtError for malformed tokens; isExpired() returns true on malformed input (fail-secure).',
      'claim<T>() returns null when the claim is absent or the token is invalid.',
    ],
    methods: [
      {
        name: 'decode',
        signature: 'decode(token: string): T',
        description: 'Decodes the payload segment of a JWT and returns it typed.',
        returns: 'T',
      },
      {
        name: 'isExpired',
        signature: 'isExpired(token: string, leewaySeconds: any): boolean',
        description: `Returns \`true\` when the token is expired relative to \`Date.now()\`.
Missing or non-numeric \`exp\` counts as expired (fail-secure).`,
        returns: 'boolean',
      },
      {
        name: 'expiresIn',
        signature: 'expiresIn(token: string): number',
        description: `Returns milliseconds until the token expires.
Negative when already expired. \`0\` when \`exp\` is missing.`,
        returns: 'number',
      },
      {
        name: 'claim',
        signature: 'claim(token: string, name: string): T | null',
        description: `Extracts a single claim from the payload. Returns \`null\` when the claim is absent
or the token is malformed.`,
        returns: 'T | null',
      },
    ],
    example: `import { JwtService } from '@angular-helpers/security';

@Component({...})
export class SessionGuard {
  private jwt = inject(JwtService);

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    return !this.jwt.isExpired(token, 30); // 30s leeway
  }

  currentUserId(): string | null {
    const token = localStorage.getItem('access_token');
    return token ? this.jwt.claim<string>(token, 'sub') : null;
  }
}`,
  },
  {
    id: 'hibp',
    name: 'HibpService',
    description:
      'Have I Been Pwned k-anonymity leaked-password check. Only the first 5 hex chars of the SHA-1 hash leave the browser; the full password is never transmitted. Fail-open on network errors.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: true,
    browserSupport: 'All modern browsers with Web Crypto API and fetch',
    notes: [
      'Complements PasswordStrengthService — entropy says "is it strong?", HIBP says "is it already leaked?".',
      'Returns { leaked: false, error: "network" } on failures — never throws, never blocks form submission.',
      'HIBP_CONFIG injection token overrides the endpoint for enterprise proxies or test fixtures.',
    ],
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'isPasswordLeaked',
        signature: 'isPasswordLeaked(password: string): Promise<HibpResult>',
        description: `Returns whether the given password is present in the HIBP breach corpus.
Never throws: network failures return \`{ leaked: false, error: 'network' }\`,
unsupported environments return \`{ leaked: false, error: 'unsupported' }\`.`,
        returns: 'Promise<HibpResult>',
      },
    ],
    example: `import { HibpService } from '@angular-helpers/security';

@Component({...})
export class RegistrationComponent {
  private hibp = inject(HibpService);

  async checkPassword(password: string) {
    const { leaked, count, error } = await this.hibp.isPasswordLeaked(password);
    if (error) return; // fail-open
    if (leaked) alert(\`This password has appeared in \${count} data breaches.\`);
  }
}`,
  },
  {
    id: 'csrf',
    name: 'CsrfService',
    description:
      'Double-submit CSRF token helper. Generates cryptographically secure tokens via WebCryptoService and persists them in the configured storage. Pair with withCsrfHeader() functional interceptor for automatic header injection.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Default header is X-CSRF-Token to avoid collisions with Angular HttpClientXsrfModule (X-XSRF-TOKEN).',
      'Token lifecycle (create, rotate, clear) is the application responsibility — typically issued by the backend at login.',
      'withCsrfHeader() only injects the header on POST/PUT/PATCH/DELETE by default.',
    ],
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'generateToken',
        signature: 'generateToken(): string',
        description: `Generates a new CSRF token as a 32-byte hex string. The token is NOT persisted
automatically — call  to save it.`,
        returns: 'string',
      },
      {
        name: 'storeToken',
        signature: 'storeToken(token: string): void',
        description: 'Persists the token to the configured storage.',
        returns: 'void',
      },
      {
        name: 'getToken',
        signature: 'getToken(): string | null',
        description: `Returns the stored token, or \`null\` when unset or outside a browser environment.`,
        returns: 'string | null',
      },
      {
        name: 'clearToken',
        signature: 'clearToken(): void',
        description: 'Removes the stored token.',
        returns: 'void',
      },
    ],
    example: `import { provideSecurity, CsrfService, withCsrfHeader } from '@angular-helpers/security';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

bootstrapApplication(App, {
  providers: [
    provideSecurity({ enableCsrf: true }),
    provideHttpClient(withInterceptors([withCsrfHeader()])),
  ],
});

// After login
const csrf = inject(CsrfService);
csrf.storeToken(response.csrfToken);
// Subsequent POST/PUT/PATCH/DELETE requests automatically carry X-CSRF-Token.`,
  },
  {
    id: 'rate-limiter',
    name: 'RateLimiterService',
    description:
      'Client-side rate limiter with per-key policies. Supports token-bucket (smooth limiting with burst capacity) and sliding-window (strict max operations per time window). Signal-based state for reactive UIs.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      "Use to protect the user's own backend from accidental bursts (typeahead, button mashing, retries).",
      'Unknown keys are fail-open: canExecute returns signal(true), consume is a no-op.',
      'All state is in-memory for the service instance lifetime; cross-tab sync is out of scope for v1.',
    ],
    methods: [
      {
        name: 'configure',
        signature: 'configure(key: string, policy: RateLimitPolicy): void',
        description: `Registers or updates the policy for \`key\`. Re-configuring an existing key resets its state.`,
        returns: 'void',
      },
      {
        name: 'consume',
        signature: 'consume(key: string, tokens: any): Promise<void>',
        description: `Attempts to consume \`tokens\` units from the bucket. Resolves on success; rejects with
 when the bucket is exhausted.

For undeclared keys, this method resolves immediately without consuming anything
(fail-open behaviour — intentional to avoid silent failures when a policy is missing).`,
        returns: 'Promise<void>',
      },
      {
        name: 'canExecute',
        signature: 'canExecute(key: string): Signal<boolean>',
        description: `Reactive signal indicating whether a single unit can be consumed from \`key\` right now.
For undeclared keys, returns \`signal(true)\`.`,
        returns: 'Signal<boolean>',
      },
      {
        name: 'remaining',
        signature: 'remaining(key: string): Signal<number>',
        description: `Reactive signal holding the remaining capacity for \`key\`.
For undeclared keys, returns \`signal(Infinity)\`.`,
        returns: 'Signal<number>',
      },
      {
        name: 'reset',
        signature: 'reset(key: string): void',
        description: `Resets the counter for \`key\` to its maximum. No-op for undeclared keys.`,
        returns: 'void',
      },
    ],
    example: `import { RateLimiterService, RateLimitExceededError } from '@angular-helpers/security';

@Component({...})
export class SearchComponent {
  private rateLimiter = inject(RateLimiterService);

  constructor() {
    this.rateLimiter.configure('search', {
      type: 'token-bucket',
      capacity: 5,
      refillPerSecond: 1,
    });
  }

  canSearch = this.rateLimiter.canExecute('search');   // Signal<boolean>
  remaining = this.rateLimiter.remaining('search');    // Signal<number>

  async search(query: string) {
    try {
      await this.rateLimiter.consume('search');
      return this.api.search(query);
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        // show countdown using err.retryAfterMs
      }
    }
  }
}`,
  },
  {
    id: 'sensitive-clipboard',
    name: 'SensitiveClipboardService',
    description:
      'Copies sensitive strings to the clipboard with verified automatic clearing. Mirrors password-manager behaviour: reads the clipboard before clearing and skips when the content no longer matches what was written, preventing clobbering of unrelated user copies.',
    scope: 'provided',
    importPath: '@angular-helpers/security',
    requiresSecureContext: true,
    browserSupport: 'Browsers with navigator.clipboard (modern Chromium, Firefox, Safari)',
    notes: [
      'Default clearAfterMs is 15 seconds; set 0 to disable auto-clear.',
      'Read permission may be required to verify the clipboard before clearing — on denial, the clear is skipped.',
      'Pending clear timers are cancelled automatically when the owning injector is destroyed.',
    ],
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'copy',
        signature: 'copy(text: string, options: SensitiveCopyOptions): Promise<void>',
        description: `Writes \`text\` to the clipboard and schedules an auto-clear.`,
        returns: 'Promise<void>',
      },
      {
        name: 'copy$',
        signature: 'copy$(text: string, options: SensitiveCopyOptions): Observable<CopyStatus>',
        description: `Reactive variant of . Emits \`'copied'\` immediately after writing, then
\`'cleared'\` | \`'read-denied'\` | \`'error'\` once the auto-clear completes (or is skipped).`,
        returns: 'Observable<CopyStatus>',
      },
      {
        name: 'cancelPendingClear',
        signature: 'cancelPendingClear(): void',
        description: 'Cancels any pending auto-clear timer. The clipboard content is not modified.',
        returns: 'void',
      },
      {
        name: 'clear',
        signature: 'clear(): Promise<void>',
        description: 'Forcefully clears the clipboard unconditionally.',
        returns: 'Promise<void>',
      },
    ],
    example: `import { SensitiveClipboardService } from '@angular-helpers/security';

@Component({...})
export class ApiKeyPanel {
  private sensitiveClipboard = inject(SensitiveClipboardService);

  async copyKey(value: string) {
    await this.sensitiveClipboard.copy(value, { clearAfterMs: 15_000 });
  }
}`,
  },
  {
    id: 'security-validators',
    name: 'SecurityValidators (Reactive Forms)',
    description:
      'Static factory class exposing Reactive Forms validators that bridge the shared security helpers into Angular ValidatorFn contracts. Lives in the @angular-helpers/security/forms sub-entry so consumers not using Reactive Forms do not pay a bundle cost.',
    scope: 'root',
    importPath: '@angular-helpers/security/forms',
    requiresSecureContext: false,
    browserSupport: 'All browsers (DOMParser required for safeHtml)',
    notes: [
      'Install @angular/forms. The main @angular-helpers/security entry has zero runtime dependency on @angular/forms.',
      'Validators are pure factory functions — no provider registration required.',
      'safeHtml() returns null (no error) in SSR contexts to avoid blocking server-rendered forms.',
    ],
    methods: [
      {
        name: 'strongPassword',
        signature: 'static strongPassword(options?: { minScore?: 0 | 1 | 2 | 3 | 4 }): ValidatorFn',
        description:
          'Returns ValidatorFn that fails with { weakPassword: { score, required } } when entropy score < minScore (default 2).',
        returns: 'ValidatorFn',
      },
      {
        name: 'safeHtml',
        signature: 'static safeHtml(options?: HtmlSanitizerOptions): ValidatorFn',
        description:
          'Fails with { unsafeHtml: true } when sanitization would alter the input. Allowlist is configurable.',
        returns: 'ValidatorFn',
      },
      {
        name: 'safeUrl',
        signature: 'static safeUrl(options?: { schemes?: readonly string[] }): ValidatorFn',
        description:
          'Fails with { unsafeUrl: true } for malformed URLs or schemes outside the allowlist (default: http, https).',
        returns: 'ValidatorFn',
      },
      {
        name: 'noScriptInjection',
        signature: 'static noScriptInjection(): ValidatorFn',
        description:
          'Fails with { scriptInjection: true } for <script>, javascript:, or inline event handlers.',
        returns: 'ValidatorFn',
      },
      {
        name: 'noSqlInjectionHints',
        signature: 'static noSqlInjectionHints(): ValidatorFn',
        description:
          'Fails with { sqlInjectionHint: true } for common SQLi sentinels — defense-in-depth; parameterize server-side queries.',
        returns: 'ValidatorFn',
      },
    ],
    example: `import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SecurityValidators } from '@angular-helpers/security/forms';

@Component({...})
export class SignupFormComponent {
  form = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      SecurityValidators.strongPassword({ minScore: 3 }),
    ]),
    bio: new FormControl('', [SecurityValidators.safeHtml()]),
    homepage: new FormControl('', [SecurityValidators.safeUrl({ schemes: ['https:'] })]),
  });
}`,
  },
  {
    id: 'signal-forms-validators',
    name: 'Signal Forms validators',
    description:
      'Angular v21 Signal Forms rule functions mirroring the Reactive Forms validators, plus an async hibpPassword() rule. Lives in the @angular-helpers/security/signal-forms sub-entry. Both paradigms delegate to the same shared core helpers, guaranteeing behavioural parity for the same input.',
    scope: 'root',
    importPath: '@angular-helpers/security/signal-forms',
    requiresSecureContext: false,
    browserSupport: 'Angular v21+ (Signal Forms API)',
    notes: [
      'Install @angular/forms v21+. The main @angular-helpers/security entry has zero dependency on @angular/forms.',
      'Rule functions are idiomatic: form(model, (p) => { strongPassword(p.password); }).',
      'hibpPassword() requires provideHibp() in the injector hierarchy and fails open on network errors.',
    ],
    methods: [
      {
        name: 'strongPassword',
        signature: 'strongPassword(path, options?): void',
        description:
          "Sync rule — returns { kind: 'weakPassword', message } when entropy score is below minScore (default 2).",
        returns: 'void',
      },
      {
        name: 'safeHtml',
        signature: 'safeHtml(path, options?): void',
        description:
          "Sync rule — returns { kind: 'unsafeHtml', message } when sanitization alters the input. No-op on SSR.",
        returns: 'void',
      },
      {
        name: 'safeUrl',
        signature: 'safeUrl(path, options?): void',
        description:
          "Sync rule — returns { kind: 'unsafeUrl', message } for malformed URLs or blocked schemes.",
        returns: 'void',
      },
      {
        name: 'noScriptInjection',
        signature: 'noScriptInjection(path, options?): void',
        description: "Sync rule — returns { kind: 'scriptInjection', message }.",
        returns: 'void',
      },
      {
        name: 'noSqlInjectionHints',
        signature: 'noSqlInjectionHints(path, options?): void',
        description: "Sync rule — returns { kind: 'sqlInjectionHint', message }.",
        returns: 'void',
      },
      {
        name: 'hibpPassword',
        signature: 'hibpPassword(path, options?): void',
        description:
          "Async rule using validateAsync. Debounces changes (default 300ms), injects HibpService, returns { kind: 'leakedPassword', message, count } on match. Fails open on network errors.",
        returns: 'void',
      },
    ],
    example: `import { signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import {
  strongPassword,
  hibpPassword,
  safeHtml,
  safeUrl,
} from '@angular-helpers/security/signal-forms';

@Component({...})
export class SignupSignalFormsComponent {
  model = signal({ email: '', password: '', bio: '', homepage: '' });

  f = form(this.model, (p) => {
    required(p.email);
    required(p.password);
    strongPassword(p.password, { minScore: 3 });
    hibpPassword(p.password); // async — validateAsync with debounce + abort
    safeHtml(p.bio);
    safeUrl(p.homepage, { schemes: ['https:'] });
  });
}`,
  },
];

export const SECURITY_INTERFACES = [
  {
    name: 'RegexSecurityConfig',
    description: 'Options for testRegex() execution.',
    fields: [
      { name: 'timeout?', type: 'number', description: 'Timeout in ms (default: 5000)' },
      {
        name: 'maxComplexity?',
        type: 'number',
        description: 'Max allowed complexity (default: 10)',
      },
      {
        name: 'allowBacktracking?',
        type: 'boolean',
        description: 'Allow backtracking (default: false)',
      },
      { name: 'safeMode?', type: 'boolean', description: 'Block unsafe patterns (default: false)' },
    ],
  },
  {
    name: 'RegexTestResult',
    description: 'Result returned by testRegex().',
    fields: [
      { name: 'match', type: 'boolean', description: 'Whether the pattern matched' },
      { name: 'matches?', type: 'RegExpMatchArray[]', description: 'All matches found' },
      { name: 'groups?', type: 'Record<string, string>', description: 'Captured groups' },
      { name: 'executionTime', type: 'number', description: 'Execution time in ms' },
      { name: 'timeout', type: 'boolean', description: 'True if execution timed out' },
      { name: 'error?', type: 'string', description: 'Error message if one occurred' },
    ],
  },
  {
    name: 'RegexSecurityResult',
    description: 'Result returned by analyzePatternSecurity().',
    fields: [
      { name: 'safe', type: 'boolean', description: 'Whether the pattern is considered safe' },
      { name: 'complexity', type: 'number', description: 'Pattern complexity score (0–∞)' },
      { name: 'risk', type: "'low' | 'medium' | 'high' | 'critical'", description: 'Risk level' },
      { name: 'warnings', type: 'string[]', description: 'Security warnings' },
      { name: 'recommendations', type: 'string[]', description: 'Improvement suggestions' },
    ],
  },
  {
    name: 'SecureStorageConfig',
    description: 'Configuration options for SecureStorageService.',
    fields: [
      {
        name: 'storage?',
        type: "'local' | 'session'",
        description: 'Storage target (default: local)',
      },
      {
        name: 'pbkdf2Iterations?',
        type: 'number',
        description: 'PBKDF2 iterations (default: 600,000)',
      },
    ],
  },
  {
    name: 'SanitizerConfig',
    description: 'Configuration options for InputSanitizerService.',
    fields: [
      {
        name: 'allowedTags?',
        type: 'string[]',
        description: 'HTML tags to allow (default: b, i, em, strong, a, p, br, ul, ol, li, span)',
      },
      {
        name: 'allowedAttributes?',
        type: 'Record<string, string[]>',
        description: 'Attributes allowed per tag (default: a[href])',
      },
    ],
  },
  {
    name: 'PasswordStrengthResult',
    description: 'Result returned by PasswordStrengthService.assess().',
    fields: [
      {
        name: 'score',
        type: '0 | 1 | 2 | 3 | 4',
        description: 'Strength score from 0 (very weak) to 4 (very strong)',
      },
      {
        name: 'label',
        type: "'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'",
        description: 'Human-readable strength label',
      },
      { name: 'entropy', type: 'number', description: 'Calculated entropy in bits' },
      { name: 'feedback', type: 'string[]', description: 'Improvement suggestions' },
    ],
  },
];
