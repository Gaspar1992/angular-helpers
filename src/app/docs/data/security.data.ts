import { ServiceDoc } from '../models/doc-meta.model';

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
        signature: 'static builder(): RegexSecurityBuilder',
        description: 'Creates a new RegexSecurityBuilder instance for fluent pattern construction.',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'testRegex',
        signature:
          'testRegex(pattern: string, text: string, options?: RegexSecurityConfig): Promise<RegexTestResult>',
        description:
          'Runs a regex match in a Web Worker with configurable timeout. Returns the match result plus execution metrics.',
        returns: 'Promise<RegexTestResult>',
      },
      {
        name: 'analyzePatternSecurity',
        signature: 'analyzePatternSecurity(pattern: string): Promise<RegexSecurityResult>',
        description:
          'Analyzes the given pattern for ReDoS risk without executing it. Returns risk level, complexity, and recommendations.',
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
        signature: 'pattern(p: string): RegexSecurityBuilder',
        description: 'Sets a raw pattern string.',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'characterSet',
        signature: 'characterSet(chars: string, negate?: boolean): RegexSecurityBuilder',
        description: 'Appends a character class [chars].',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'quantifier',
        signature: 'quantifier(q: string): RegexSecurityBuilder',
        description: 'Appends a quantifier (e.g. "+", "*", "{2,}").',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'timeout',
        signature: 'timeout(ms: number): RegexSecurityBuilder',
        description: 'Sets the execution timeout in milliseconds.',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'safeMode',
        signature: 'safeMode(): RegexSecurityBuilder',
        description: 'Enables safe mode — blocks execution if the pattern is considered unsafe.',
        returns: 'RegexSecurityBuilder',
      },
      {
        name: 'build',
        signature:
          'build(): { pattern: string; options: RegexBuilderOptions; security: RegexSecurityConfig }',
        description:
          'Returns the built pattern config object. Pass pattern and security to testRegex() to execute.',
        returns: '{ pattern: string; options: RegexBuilderOptions; security: RegexSecurityConfig }',
      },
      {
        name: 'execute',
        signature: 'execute(text: string, service: RegexSecurityService): Promise<RegexTestResult>',
        description:
          'Executes the pattern against text using the provided service. Shorthand for build() + testRegex().',
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
        name: 'hash',
        signature: 'hash(data: string | ArrayBuffer, algorithm?: HashAlgorithm): Promise<string>',
        description:
          'Hashes the given data using the specified algorithm (default: SHA-256). Returns a hex string.',
        returns: 'Promise<string>',
      },
      {
        name: 'generateAesKey',
        signature: 'generateAesKey(length?: AesKeyLength): Promise<CryptoKey>',
        description: 'Generates a new AES-GCM key of the given bit length (default: 256).',
        returns: 'Promise<CryptoKey>',
      },
      {
        name: 'encryptAes',
        signature:
          'encryptAes(key: CryptoKey, data: string | ArrayBuffer): Promise<AesEncryptResult>',
        description: 'Encrypts data with AES-GCM. Returns ciphertext and the generated IV.',
        returns: 'Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }>',
      },
      {
        name: 'decryptAes',
        signature:
          'decryptAes(key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array): Promise<string>',
        description: 'Decrypts AES-GCM ciphertext and returns the plaintext string.',
        returns: 'Promise<string>',
      },
      {
        name: 'exportKey',
        signature: 'exportKey(key: CryptoKey): Promise<JsonWebKey>',
        description: 'Exports a CryptoKey as a JWK object for storage or transfer.',
        returns: 'Promise<JsonWebKey>',
      },
      {
        name: 'importAesKey',
        signature: 'importAesKey(jwk: JsonWebKey): Promise<CryptoKey>',
        description: 'Imports an AES-GCM key from a JWK object.',
        returns: 'Promise<CryptoKey>',
      },
      {
        name: 'generateRandomBytes',
        signature: 'generateRandomBytes(length: number): Uint8Array',
        description: 'Returns a Uint8Array of cryptographically secure random bytes.',
        returns: 'Uint8Array',
      },
      {
        name: 'randomUUID',
        signature: 'randomUUID(): string',
        description: 'Generates a cryptographically secure UUID v4 string.',
        returns: 'string',
      },
      {
        name: 'generateHmacKey',
        signature: 'generateHmacKey(algorithm?: HmacAlgorithm): Promise<CryptoKey>',
        description:
          'Generates a new HMAC key for the specified algorithm (default: HMAC-SHA-256).',
        returns: 'Promise<CryptoKey>',
      },
      {
        name: 'sign',
        signature: 'sign(key: CryptoKey, data: string | ArrayBuffer): Promise<string>',
        description:
          'Creates an HMAC signature of the data using the provided key. Returns a hex-encoded string.',
        returns: 'Promise<string>',
      },
      {
        name: 'verify',
        signature:
          'verify(key: CryptoKey, data: string | ArrayBuffer, signature: string): Promise<boolean>',
        description:
          'Verifies an HMAC signature against the data using the provided key. Returns false for malformed input — never throws.',
        returns: 'Promise<boolean>',
      },
      {
        name: 'importHmacKey',
        signature: 'importHmacKey(jwk: JsonWebKey, algorithm?: HmacAlgorithm): Promise<CryptoKey>',
        description: 'Imports an HMAC key from a JWK object.',
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
        description: 'Returns whether the service can be used in the current environment.',
        returns: 'boolean',
      },
      {
        name: 'initWithPassphrase',
        signature: 'initWithPassphrase(passphrase: string, explicitSalt?: string): Promise<void>',
        description:
          'Initializes the service with a passphrase-derived key using PBKDF2. Salt is auto-persisted to storage.',
        returns: 'Promise<void>',
      },
      {
        name: 'set',
        signature: 'set<T>(key: string, value: T, namespace?: string): Promise<void>',
        description: 'Encrypts and stores a value. A fresh random IV is generated for every write.',
        returns: 'Promise<void>',
      },
      {
        name: 'get',
        signature: 'get<T>(key: string, namespace?: string): Promise<T | null>',
        description:
          'Decrypts and returns a stored value. Returns null if key does not exist or decryption fails.',
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
        description:
          'Clears entries. Without namespace, clears entire storage. With namespace, clears only that namespace.',
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
        description: 'Returns whether the service can be used in the current environment.',
        returns: 'boolean',
      },
      {
        name: 'sanitizeHtml',
        signature: 'sanitizeHtml(input: string): string',
        description:
          'Parses and sanitizes HTML, keeping only allowed tags and attributes. Strips script tags and event handlers.',
        returns: 'string',
      },
      {
        name: 'sanitizeUrl',
        signature: 'sanitizeUrl(input: string): string | null',
        description:
          'Validates URL via URL constructor. Returns normalized URL only for http/https schemes. Returns null for javascript:, data:, vbscript:, or relative URLs.',
        returns: 'string | null',
      },
      {
        name: 'escapeHtml',
        signature: 'escapeHtml(input: string): string',
        description:
          'Escapes HTML special characters (&, <, >, ", \') for safe text interpolation.',
        returns: 'string',
      },
      {
        name: 'sanitizeJson',
        signature: 'sanitizeJson(input: string): unknown | null',
        description:
          'Safely parses JSON without eval. Returns parsed value on success, null on any error.',
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
        description:
          'Evaluates password strength. Returns score (0-4), label, entropy in bits, and feedback messages. Never throws.',
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
