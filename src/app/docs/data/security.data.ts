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
];
