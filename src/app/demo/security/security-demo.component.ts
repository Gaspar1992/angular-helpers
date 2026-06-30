import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RegexSecurityService,
  WebCryptoService,
  SecureStorageService,
  InputSanitizerService,
  PasswordStrengthService,
  RateLimiterService,
  WebAuthnService,
  SafeHtmlDirective,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@angular-helpers/security';

interface LogEntry {
  id: number;
  time: string;
  section: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

@Component({
  selector: 'app-security-demo',
  imports: [DecimalPipe, FormsModule, SafeHtmlDirective],
  styleUrls: ['../services/demo.styles.css'],
  template: `
    <div class="max-width-container py-12 sm:py-20 animate-in fade-in duration-700">
      <!-- Header -->
      <header class="mb-16 text-center sm:text-left">
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-5 mb-8">
          <div
            class="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-5xl shadow-2xl border border-primary/20 ring-1 ring-primary/10"
          >
            🛡️
          </div>
          <div>
            <h1 class="text-3xl sm:text-5xl font-black text-base-content m-0 tracking-tighter">
              Security Engine
            </h1>
            <p class="text-lg text-base-content/50 m-0 mt-2 font-medium leading-relaxed">
              Reactive defense-in-depth utilities for modern Angular applications.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2.5 justify-center sm:justify-start">
          <span class="badge badge-primary font-black">Regex Security</span>
          <span class="badge badge-secondary font-black">WebCrypto</span>
          <span class="badge badge-accent font-black">Secure Storage</span>
          <span class="badge badge-info font-black">Input Sanitizer</span>
          <span class="badge badge-success font-black">Password Strength</span>
          <span class="badge badge-warning font-black">Rate Limiter</span>
          <span class="badge badge-success font-black">WebAuthn</span>
        </div>
      </header>

      <!-- Demo Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <!-- Regex Security -->
        <section class="svc-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-primary text-3xl">🔒</span> RegexSecurity
            </h2>
            <span class="badge badge-outline border-primary/30 text-primary font-bold"
              >ReDoS Protection</span
            >
          </div>
          <p class="svc-desc">
            Safe regex execution in Web Workers to prevent main-thread freezing during complex
            pattern matching.
          </p>

          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label>Pattern</label>
                <input
                  type="text"
                  [(ngModel)]="regexPattern"
                  placeholder="Pattern"
                  class="demo-input w-full font-mono text-xs"
                />
              </div>
              <div class="space-y-2">
                <label>Test Input</label>
                <input
                  type="text"
                  [(ngModel)]="regexInput"
                  placeholder="Test input"
                  class="demo-input w-full"
                />
              </div>
            </div>
            <div class="flex gap-4">
              <button
                (click)="testRegex()"
                [disabled]="regexStatus() === 'running'"
                class="btn btn-primary flex-1"
              >
                @if (regexStatus() === 'running') {
                  <span class="spinner"></span>
                }
                Run Safe Test
              </button>
              <button (click)="analyzePattern()" class="btn btn-secondary flex-1">
                Analyze Pattern
              </button>
            </div>
            @if (regexResult()) {
              <div
                class="svc-result animate-in fade-in duration-300 flex items-center justify-between font-black"
                [class.text-success]="regexStatus() === 'done'"
                [class.text-error]="regexStatus() === 'error'"
              >
                <span class="tracking-tight">{{ regexResult() }}</span>
                @if (regexTime()) {
                  <span class="text-[10px] opacity-40 font-black uppercase tracking-[0.2em]"
                    >{{ regexTime() }}ms</span
                  >
                }
              </div>
            }
          </div>
        </section>

        <!-- WebCrypto -->
        <section class="svc-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-secondary text-3xl">🔐</span> WebCrypto
            </h2>
            <span class="badge badge-outline border-secondary/30 text-secondary font-bold"
              >Native Crypto</span
            >
          </div>
          <p class="svc-desc">
            Hardware-accelerated hashing, HMAC, and AES encryption using the browser's internal
            crypto engine.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button (click)="hashData()" class="btn btn-primary">SHA-256</button>
            <button (click)="generateHmac()" class="btn btn-secondary">HMAC</button>
            <button (click)="encryptAes()" class="btn btn-secondary">AES-GCM</button>
          </div>

          <div class="mt-8 space-y-4">
            @if (hashResult()) {
              <div class="svc-result animate-in slide-in-from-bottom-2 duration-300">
                <span class="kv-key block mb-2">SHA-256 Result</span>
                <code class="text-xs font-mono text-primary break-all font-bold tracking-tight">{{
                  hashResult()
                }}</code>
              </div>
            }
            @if (hmacSignature()) {
              <div class="svc-result animate-in slide-in-from-bottom-2 duration-300">
                <span class="kv-key block mb-2">HMAC Signature</span>
                <code class="text-xs font-mono text-secondary break-all font-bold tracking-tight">{{
                  hmacSignature()
                }}</code>
              </div>
            }
            @if (encryptedData()) {
              <div class="svc-result animate-in slide-in-from-bottom-2 duration-300">
                <span class="kv-key block mb-2">AES Ciphertext</span>
                <code class="text-xs font-mono text-accent break-all font-bold tracking-tight">{{
                  encryptedData()
                }}</code>
              </div>
            }
          </div>
        </section>

        <!-- SecureStorage -->
        <section class="svc-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-accent text-3xl">🗄️</span> SecureStorage
            </h2>
            <span class="badge badge-outline border-accent/30 text-accent font-bold">AES-GCM</span>
          </div>
          <p class="svc-desc">
            Authenticated encryption for localStorage and sessionStorage to protect sensitive user
            preferences.
          </p>

          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label>Storage Key</label>
                <input
                  type="text"
                  [(ngModel)]="storageKey"
                  placeholder="Key"
                  class="demo-input w-full font-mono"
                />
              </div>
              <div class="space-y-2">
                <label>Value (JSON)</label>
                <input
                  type="text"
                  [(ngModel)]="storageValue"
                  placeholder="Value (JSON)"
                  class="demo-input w-full font-mono"
                />
              </div>
            </div>
            <div class="flex flex-wrap gap-4">
              <button (click)="storeData()" class="btn btn-primary flex-1">Save Secure</button>
              <button (click)="retrieveData()" class="btn btn-secondary flex-1">
                Load & Decrypt
              </button>
            </div>
            <div class="flex gap-4">
              <button
                (click)="initWithPassphrase()"
                class="btn btn-ghost border border-base-content/10 flex-1"
              >
                Init with Pass
              </button>
              <button
                (click)="clearStorage()"
                class="btn btn-ghost text-error border border-error/10 hover:bg-error/10 flex-1"
              >
                Clear All
              </button>
            </div>
            @if (storageResult()) {
              <div
                class="svc-result animate-in fade-in duration-300 font-black text-sm"
                [class.text-success]="storageResult().startsWith('✅')"
                [class.text-error]="storageResult().startsWith('❌')"
              >
                {{ storageResult() }}
              </div>
            }
          </div>
        </section>

        <!-- Input Sanitizer -->
        <section class="svc-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-info text-3xl">🧹</span> InputSanitizer
            </h2>
            <span class="badge badge-outline border-info/30 text-info font-bold"
              >XSS Protection</span
            >
          </div>
          <p class="svc-desc">
            Advanced HTML sanitization and strict URL validation to prevent Cross-Site Scripting
            (XSS) attacks.
          </p>

          <div class="space-y-6">
            <div class="space-y-2">
              <label>Unsafe HTML Input</label>
              <input
                type="text"
                [(ngModel)]="htmlInput"
                placeholder="<b>Bold</b><script>alert(1)</script>"
                class="demo-input w-full font-mono"
              />
            </div>
            <div class="flex gap-4">
              <button (click)="sanitizeHtml()" class="btn btn-primary flex-1">Sanitize</button>
              <button (click)="escapeHtml()" class="btn btn-secondary flex-1">Escape HTML</button>
            </div>

            <div class="space-y-2 pt-4">
              <label>URL to Validate</label>
              <input
                type="text"
                [(ngModel)]="urlInput"
                placeholder="https://example.com"
                class="demo-input w-full font-mono"
              />
            </div>
            <button (click)="sanitizeUrl()" class="btn btn-secondary w-full">
              Validate & Clean URL
            </button>

            @if (sanitizedHtml()) {
              <div class="svc-result animate-in slide-in-from-bottom-2 duration-300">
                <span class="kv-key block mb-2">Sanitization Result</span>
                <code
                  class="text-xs font-mono text-info break-all leading-relaxed font-bold tracking-tight"
                  >{{ sanitizedHtml() }}</code
                >
              </div>
            }
            @if (sanitizedUrl() !== null) {
              <div
                class="svc-result animate-in fade-in duration-300 flex items-center justify-between font-black text-sm"
                [class.text-success]="sanitizedUrl()"
                [class.text-error]="!sanitizedUrl()"
              >
                <span>{{ sanitizedUrl() ?? 'URL rejected by policy' }}</span>
                @if (sanitizedUrl()) {
                  <span>✅</span>
                } @else {
                  <span>❌</span>
                }
              </div>
            }

            <div class="mt-4 p-4 bg-base-content/5 rounded-2xl border border-base-content/5">
              <span class="kv-key block mb-2">Live Sanitized Render</span>
              <div [safeHtml]="htmlInput()"></div>
            </div>
          </div>
        </section>

        <!-- Password Strength -->
        <section class="svc-card lg:col-span-2">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-success text-3xl">🔑</span> PasswordStrength
            </h2>
            <span class="badge badge-outline border-success/30 text-success font-bold"
              >Entropy Analysis</span
            >
          </div>
          <p class="svc-desc">
            Information-theoretic security assessment with zxcvbn-inspired entropy calculation and
            real-time security tips.
          </p>

          <div class="space-y-8">
            <div class="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                [(ngModel)]="passwordInput"
                placeholder="Enter password to analyze..."
                class="demo-input flex-1 font-mono text-xl py-10 shadow-2xl border-base-content/10"
              />
              <button (click)="checkPassword()" class="btn btn-primary px-12 text-sm">
                Assess Strength
              </button>
            </div>

            @if (passwordScore() !== null) {
              <div class="svc-result animate-in zoom-in-95 duration-500">
                <div class="flex flex-col md:flex-row md:items-center gap-12">
                  <div class="flex-1 space-y-6">
                    <div class="flex justify-between items-end">
                      <span class="kv-key">Security Score</span>
                      <span
                        class="font-black text-2xl tracking-tighter"
                        [class.text-success]="passwordScore() >= 3"
                        [class.text-warning]="passwordScore() === 2"
                        [class.text-error]="passwordScore() <= 1"
                      >
                        {{ passwordLabel() }}
                        <span class="opacity-30 text-lg">({{ passwordScore() }}/4)</span>
                      </span>
                    </div>
                    <div class="flex gap-3 h-5">
                      @for (i of [0, 1, 2, 3, 4]; track i) {
                        <div
                          class="flex-1 rounded-full transition-all duration-700 shadow-lg shadow-black/40"
                          [class.bg-success]="i < passwordScore() && passwordScore() >= 3"
                          [class.bg-warning]="i < passwordScore() && passwordScore() === 2"
                          [class.bg-error]="i < passwordScore() && passwordScore() <= 1"
                          [class.bg-base-content/5]="i >= passwordScore()"
                        ></div>
                      }
                    </div>
                    <p class="text-base text-base-content/40 m-0 font-bold">
                      Estimated Entropy:
                      <span class="text-base-content tracking-tighter"
                        >{{ passwordEntropy() | number: '1.0-2' }} bits</span
                      >
                    </p>
                  </div>

                  @if (passwordFeedback().length > 0) {
                    <div
                      class="md:w-1/2 p-8 bg-base-content/5 rounded-[2rem] border border-base-content/5 shadow-inner"
                    >
                      <span class="kv-key block mb-6">Security Recommendations</span>
                      <ul class="list-none p-0 m-0 space-y-4">
                        @for (tip of passwordFeedback(); track tip) {
                          <li class="flex gap-4 text-sm font-bold text-base-content/80">
                            <span class="text-primary font-black text-lg leading-none">•</span>
                            <span>{{ tip }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Rate Limiter -->
        <section class="svc-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-warning text-3xl">⏳</span> RateLimiter
            </h2>
            <span class="badge badge-outline border-warning/30 text-warning font-bold"
              >Token Bucket</span
            >
          </div>
          <p class="svc-desc">
            Client-side rate limiting with persistent local storage. Refills smoothly over time and
            prevents spamming.
          </p>

          <div class="space-y-6">
            <div
              class="flex items-center justify-between p-6 bg-base-content/5 rounded-2xl border border-base-content/5"
            >
              <div>
                <span class="block text-xs opacity-55 font-bold uppercase tracking-wider"
                  >Remaining Tokens</span
                >
                <span class="text-3xl font-black text-warning">{{ remainingTokens() }}</span>
                <span class="text-sm opacity-40 font-medium"> / 10</span>
              </div>
              <div class="text-right">
                <span class="block text-xs opacity-55 font-bold uppercase tracking-wider"
                  >Storage</span
                >
                <span class="badge badge-secondary font-black">localStorage</span>
              </div>
            </div>

            <button (click)="consumeToken()" class="btn btn-primary w-full">Consume 1 Token</button>

            <p class="text-xs text-base-content/40 text-center font-bold">
              ℹ️ Try mashing the button, then refresh the page! The token count persists.
            </p>
          </div>
        </section>

        <!-- WebAuthn -->
        <section class="svc-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-success text-3xl">🔑</span> WebAuthn (Passkeys)
            </h2>
            <span class="badge badge-outline border-success/30 text-success font-bold"
              >WebAuthn API</span
            >
          </div>
          <p class="svc-desc">
            Passwordless authentication via security keys or built-in platform authenticators
            (TouchID, Windows Hello).
          </p>

          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div
                class="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 text-center"
              >
                <span class="block text-xs opacity-55 font-bold uppercase tracking-wider"
                  >Supported</span
                >
                <span
                  class="text-lg font-black"
                  [class.text-success]="webAuthnSupported()"
                  [class.text-error]="!webAuthnSupported()"
                >
                  {{ webAuthnSupported() ? 'YES' : 'NO' }}
                </span>
              </div>
              <div
                class="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 text-center"
              >
                <span class="block text-xs opacity-55 font-bold uppercase tracking-wider"
                  >Platform Auth</span
                >
                <span
                  class="text-lg font-black"
                  [class.text-success]="webAuthnPlatformAvailable()"
                  [class.text-error]="!webAuthnPlatformAvailable()"
                >
                  {{ webAuthnPlatformAvailable() ? 'AVAILABLE' : 'UNAVAILABLE' }}
                </span>
              </div>
            </div>

            <div class="flex gap-4">
              <button
                (click)="triggerWebAuthnRegister()"
                [disabled]="!webAuthnSupported()"
                class="btn btn-primary flex-1"
              >
                Register Passkey
              </button>
              <button
                (click)="triggerWebAuthnAuthenticate()"
                [disabled]="!webAuthnSupported()"
                class="btn btn-secondary flex-1"
              >
                Authenticate
              </button>
            </div>

            @if (webAuthnResult()) {
              <div class="svc-result animate-in slide-in-from-bottom-2 duration-300">
                <span class="kv-key block mb-2">WebAuthn Result</span>
                <pre
                  class="text-xs font-mono text-success overflow-x-auto max-h-48 p-4 bg-base-content/5 rounded-2xl border border-base-content/5 whitespace-pre-wrap break-all"
                  >{{ webAuthnResult() }}</pre
                >
              </div>
            }
          </div>
        </section>
      </div>

      <!-- Activity Log -->
      <section class="svc-card">
        <div class="svc-card-head">
          <h2 class="svc-card-title">Security Activity Log</h2>
          <button
            (click)="clearLogs()"
            class="btn btn-secondary btn-xs"
            [disabled]="logs().length === 0"
          >
            Clear History
          </button>
        </div>

        @if (logs().length === 0) {
          <div
            class="py-20 text-center bg-base-content/5 rounded-[2.5rem] border border-dashed border-base-content/10 shadow-inner"
          >
            <p class="text-sm text-base-content/20 font-black uppercase tracking-[0.3em] italic">
              No security events recorded
            </p>
          </div>
        } @else {
          <div class="svc-result space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pt-8">
            @for (log of logs(); track log.id) {
              <div
                class="flex items-center gap-5 p-5 rounded-2xl text-sm transition-all hover:bg-base-content/5 group border border-transparent hover:border-base-content/5"
                [class.text-success]="log.type === 'success'"
                [class.text-error]="log.type === 'error'"
                [class.text-base-content/70]="log.type === 'info'"
              >
                <span class="text-[10px] font-mono opacity-30 whitespace-nowrap tracking-tighter">{{
                  log.time
                }}</span>
                <span class="badge badge-primary font-black px-4 min-w-[100px]">{{
                  log.section
                }}</span>
                <span
                  class="flex-1 break-all font-bold italic opacity-90 group-hover:opacity-100 transition-opacity"
                  >{{ log.message }}</span
                >
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class SecurityDemoComponent {
  // Services
  private regexService = inject(RegexSecurityService);
  private cryptoService = inject(WebCryptoService);
  private storageService = inject(SecureStorageService);
  private sanitizerService = inject(InputSanitizerService);
  private passwordService = inject(PasswordStrengthService);
  private rateLimiterService = inject(RateLimiterService);
  private webAuthnService = inject(WebAuthnService);

  // Rate Limiter
  remainingTokens = this.rateLimiterService.remaining('demo-limit');

  // WebAuthn
  webAuthnSupported = signal(false);
  webAuthnPlatformAvailable = signal(false);
  webAuthnResult = signal<string | null>(null);

  constructor() {
    this.rateLimiterService.configure('demo-limit', {
      type: 'token-bucket',
      capacity: 10,
      refillPerSecond: 0.5,
      storage: 'local',
    });

    this.webAuthnSupported.set(this.webAuthnService.isSupported());
    if (this.webAuthnSupported()) {
      this.webAuthnService.isPlatformAuthenticatorAvailable().then((avail) => {
        this.webAuthnPlatformAvailable.set(avail);
      });
    }
  }

  // Regex Signals
  regexPattern = signal('^([a-z0-9_\\.-]+)@([\\da-z\\.-]+)\\.([a-z\\.]{2,6})$');
  regexInput = signal('test@example.com');
  regexStatus = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  regexResult = signal<string | null>(null);
  regexTime = signal<number | null>(null);

  // Crypto Signals
  hashResult = signal<string | null>(null);
  hmacSignature = signal<string | null>(null);
  encryptedData = signal<string | null>(null);
  private aesKey: CryptoKey | null = null;
  private hmacKey: CryptoKey | null = null;

  // Storage Signals
  storageKey = signal('user_preferences');
  storageValue = signal('{"theme": "dark", "notifications": true}');
  storageResult = signal<string | null>(null);

  // Sanitizer Signals
  htmlInput = signal('<b>Hello</b><script>alert("XSS")</script><img src=x onerror=alert(1)>');
  urlInput = signal('https://angular.dev');
  sanitizedHtml = signal<string | null>(null);
  sanitizedUrl = signal<string | null>(null);

  // Password Signals
  passwordInput = signal('');
  passwordScore = signal<number | null>(null);
  passwordLabel = signal<string | null>(null);
  passwordEntropy = signal<number | null>(null);
  passwordFeedback = signal<string[]>([]);

  // Activity Log
  logs = signal<LogEntry[]>([]);

  private log(section: string, message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    const entry: LogEntry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      section,
      message,
      type,
    };
    this.logs.update((current) => [entry, ...current.slice(0, 49)]);
  }

  // Regex Methods
  async testRegex(): Promise<void> {
    this.regexStatus.set('running');
    this.regexResult.set(null);
    this.regexTime.set(null);
    this.log('Regex', `Testing pattern: ${this.regexPattern()}`);

    const result = await this.regexService.testRegex(this.regexPattern(), this.regexInput());

    this.regexTime.set(Math.round(result.executionTime * 100) / 100);

    if (result.error) {
      this.regexStatus.set('error');
      this.regexResult.set(`Error: ${result.error}`);
      this.log('Regex', `Test failed: ${result.error}`, 'error');
    } else {
      this.regexStatus.set('done');
      this.regexResult.set(result.match ? '✅ Match found' : '❌ No match');
      this.log('Regex', `Test complete: ${result.match ? 'Match' : 'No match'}`, 'success');
    }
  }

  async analyzePattern(): Promise<void> {
    this.log('Regex', `Analyzing pattern complexity...`);
    const analysis = await this.regexService.analyzePatternSecurity(this.regexPattern());

    this.regexResult.set(
      `Complexity: ${analysis.complexity} | Risk: ${analysis.risk.toUpperCase()}`,
    );
    this.regexStatus.set('done');

    if (analysis.warnings.length > 0) {
      this.log('Regex', `Warnings found: ${analysis.warnings.join(', ')}`, 'error');
    } else {
      this.log('Regex', 'Pattern analysis: No immediate ReDoS risks detected.', 'success');
    }
  }

  // WebCrypto Methods
  async hashData(): Promise<void> {
    const input = 'Sensitive project data';
    const hash = await this.cryptoService.hash(input);
    this.hashResult.set(hash);
    this.log('WebCrypto', 'SHA-256 hash generated successfully.', 'success');
  }

  async generateHmac(): Promise<void> {
    if (!this.hmacKey) {
      this.hmacKey = await this.cryptoService.generateHmacKey();
    }
    const signature = await this.cryptoService.sign(this.hmacKey, 'Message to authenticate');
    this.hmacSignature.set(signature);
    this.log('WebCrypto', 'HMAC-SHA-256 signature generated.', 'success');
  }

  async encryptAes(): Promise<void> {
    if (!this.aesKey) {
      this.aesKey = await this.cryptoService.generateAesKey();
    }
    const result = await this.cryptoService.encryptAes(this.aesKey, 'Ultra secret payload');
    // For demo, we just hex encode the ciphertext
    const hex = Array.from(new Uint8Array(result.ciphertext))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    this.encryptedData.set(hex);
    this.log('WebCrypto', 'Data encrypted using AES-256-GCM.', 'success');
  }

  // SecureStorage Methods
  async storeData(): Promise<void> {
    try {
      const value = JSON.parse(this.storageValue());
      await this.storageService.set(this.storageKey(), value);
      this.storageResult.set(`✅ Stored encrypted value for key: ${this.storageKey()}`);
      this.log('Storage', `Encrypted and saved key: ${this.storageKey()}`, 'success');
    } catch {
      this.storageResult.set('❌ Invalid JSON value');
      this.log('Storage', 'Failed to store: Invalid JSON format', 'error');
    }
  }

  async retrieveData(): Promise<void> {
    const data = await this.storageService.get<any>(this.storageKey());
    if (data !== null) {
      this.storageResult.set(`✅ Retrieved: ${JSON.stringify(data)}`);
      this.log('Storage', `Successfully decrypted data for: ${this.storageKey()}`, 'success');
    } else {
      this.storageResult.set('❌ Key not found or decryption failed');
      this.log('Storage', `Failed to retrieve or decrypt: ${this.storageKey()}`, 'error');
    }
  }

  async initWithPassphrase(): Promise<void> {
    const pass = prompt('Enter a passphrase for storage encryption:');
    if (pass) {
      await this.storageService.initWithPassphrase(pass);
      this.storageResult.set('✅ Storage initialized with PBKDF2 derived key');
      this.log('Storage', 'Derived stable encryption key from passphrase.', 'success');
    }
  }

  clearStorage(): void {
    this.storageService.clear();
    this.storageResult.set('✅ Storage cleared');
    this.log('Storage', 'All encrypted storage entries removed.', 'info');
  }

  // Sanitizer Methods
  sanitizeHtml(): void {
    const clean = this.sanitizerService.sanitizeHtml(this.htmlInput());
    this.sanitizedHtml.set(clean);
    this.log('Sanitizer', 'HTML input sanitized (scripts/unsafe tags removed).', 'success');
  }

  escapeHtml(): void {
    const escaped = this.sanitizerService.escapeHtml(this.htmlInput());
    this.sanitizedHtml.set(escaped);
    this.log('Sanitizer', 'HTML input escaped for safe text rendering.', 'info');
  }

  sanitizeUrl(): void {
    const clean = this.sanitizerService.sanitizeUrl(this.urlInput());
    this.sanitizedUrl.set(clean);
    if (clean) {
      this.log('Sanitizer', `URL validated as safe: ${clean}`, 'success');
    } else {
      this.log('Sanitizer', 'URL rejected by security policy.', 'error');
    }
  }

  // Password Methods
  checkPassword(): void {
    if (!this.passwordInput()) {
      this.passwordScore.set(null);
      return;
    }

    const assessment = this.passwordService.assess(this.passwordInput());
    this.passwordScore.set(assessment.score);
    this.passwordLabel.set(assessment.label);
    this.passwordEntropy.set(assessment.entropy);
    this.passwordFeedback.set(assessment.feedback);

    const type = assessment.score >= 3 ? 'success' : assessment.score === 2 ? 'info' : 'error';
    this.log(
      'Password',
      `Assessment complete. Score: ${assessment.score}/4 (${assessment.label})`,
      type,
    );
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  // Rate Limiter Methods
  async consumeToken(): Promise<void> {
    try {
      await this.rateLimiterService.consume('demo-limit');
      this.log('Rate Limiter', 'Token consumed successfully.', 'success');
    } catch (error: any) {
      this.log('Rate Limiter', error.message || 'Rate limit exceeded!', 'error');
    }
  }

  // WebAuthn Methods
  async triggerWebAuthnRegister(): Promise<void> {
    try {
      this.log('WebAuthn', 'Starting registration flow...');
      const challenge = this.webAuthnService.bufferToBase64url(
        crypto.getRandomValues(new Uint8Array(16)),
      );
      const userId = this.webAuthnService.bufferToBase64url(
        crypto.getRandomValues(new Uint8Array(16)),
      );

      const options: PublicKeyCredentialCreationOptionsJSON = {
        challenge,
        rp: {
          name: 'Angular Helpers Demo',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: 'demo-user@example.com',
          displayName: 'Demo User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
        },
      };

      const credential = await this.webAuthnService.register(options);
      this.webAuthnResult.set(JSON.stringify(credential, null, 2));
      this.log('WebAuthn', 'Registration successful!', 'success');
    } catch (error: any) {
      this.webAuthnResult.set(`Error: ${error.message}`);
      this.log('WebAuthn', `Registration failed: ${error.message}`, 'error');
    }
  }

  async triggerWebAuthnAuthenticate(): Promise<void> {
    try {
      this.log('WebAuthn', 'Starting authentication flow...');
      const challenge = this.webAuthnService.bufferToBase64url(
        crypto.getRandomValues(new Uint8Array(16)),
      );

      const options: PublicKeyCredentialRequestOptionsJSON = {
        challenge,
        rpId: window.location.hostname,
        userVerification: 'required',
      };

      const credential = await this.webAuthnService.authenticate(options);
      this.webAuthnResult.set(JSON.stringify(credential, null, 2));
      this.log('WebAuthn', 'Authentication successful!', 'success');
    } catch (error: any) {
      this.webAuthnResult.set(`Error: ${error.message}`);
      this.log('WebAuthn', `Authentication failed: ${error.message}`, 'error');
    }
  }
}
