import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RegexSecurityService,
  WebCryptoService,
  SecureStorageService,
  InputSanitizerService,
  PasswordStrengthService,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <header class="mb-8 sm:mb-12">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-4xl">🛡️</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-base-content m-0">Security Demo</h1>
            <p class="text-sm sm:text-base text-base-content/80 m-0 mt-1">
              Interactive demos for @angular-helpers/security
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary badge-md">Regex Security</span>
          <span class="badge badge-secondary badge-md">WebCrypto</span>
          <span class="badge badge-accent badge-md">Secure Storage</span>
          <span class="badge badge-info badge-md">Input Sanitizer</span>
          <span class="badge badge-success badge-md">Password Strength</span>
        </div>
      </header>

      <!-- Demo Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Regex Security -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              🔒 RegexSecurityService
            </h2>
            <span class="badge badge-primary">ReDoS Protection</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">Safe regex execution in Web Workers</p>

          <div class="space-y-3">
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                [(ngModel)]="regexPattern"
                placeholder="Pattern"
                class="input input-bordered input-sm flex-1 font-mono text-xs"
              />
              <input
                type="text"
                [(ngModel)]="regexInput"
                placeholder="Test input"
                class="input input-bordered input-sm flex-1"
              />
            </div>
            <div class="flex gap-2">
              <button
                (click)="testRegex()"
                [disabled]="regexStatus() === 'running'"
                class="btn btn-primary btn-sm"
              >
                @if (regexStatus() === 'running') {
                  <span class="loading loading-spinner loading-xs"></span>
                }
                Test Regex
              </button>
              <button (click)="analyzePattern()" class="btn btn-secondary btn-sm">Analyze</button>
            </div>
            @if (regexResult()) {
              <div
                class="p-3 rounded-lg font-mono text-sm break-all"
                [class.bg-success/10]="regexStatus() === 'done'"
                [class.text-success]="regexStatus() === 'done'"
                [class.bg-error/10]="regexStatus() === 'error'"
                [class.text-error]="regexStatus() === 'error'"
              >
                {{ regexResult() }}
                @if (regexTime()) {
                  <span class="text-xs opacity-60 ml-2">({{ regexTime() }}ms)</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- WebCrypto -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              🔐 WebCryptoService
            </h2>
            <span class="badge badge-secondary">Native Crypto</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">Hashing, HMAC, and AES encryption</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button (click)="hashData()" class="btn btn-primary btn-sm">
              <span class="text-lg">#</span> SHA-256
            </button>
            <button (click)="generateHmac()" class="btn btn-secondary btn-sm">
              <span class="text-lg">✍️</span> HMAC
            </button>
            <button (click)="encryptAes()" class="btn btn-accent btn-sm">
              <span class="text-lg">🔐</span> AES
            </button>
          </div>

          @if (hashResult()) {
            <div class="mt-3 p-3 bg-base-300 rounded-lg font-mono text-xs break-all">
              <span class="text-secondary">Hash:</span> {{ hashResult() }}
            </div>
          }
          @if (hmacSignature()) {
            <div class="mt-3 p-3 bg-base-300 rounded-lg font-mono text-xs break-all">
              <span class="text-secondary">HMAC:</span> {{ hmacSignature() }}
            </div>
          }
          @if (encryptedData()) {
            <div class="mt-3 p-3 bg-base-300 rounded-lg font-mono text-xs break-all">
              <span class="text-secondary">AES:</span> {{ encryptedData() }}
            </div>
          }
        </div>

        <!-- SecureStorage -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              🗄️ SecureStorageService
            </h2>
            <span class="badge badge-accent">AES-GCM</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">Encrypted localStorage/sessionStorage</p>

          <div class="space-y-3">
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                [(ngModel)]="storageKey"
                placeholder="Key"
                class="input input-bordered input-sm flex-1 font-mono"
              />
              <input
                type="text"
                [(ngModel)]="storageValue"
                placeholder="Value (JSON)"
                class="input input-bordered input-sm flex-1 font-mono"
              />
            </div>
            <div class="flex flex-wrap gap-2">
              <button (click)="storeData()" class="btn btn-primary btn-sm">Save</button>
              <button (click)="retrieveData()" class="btn btn-secondary btn-sm">Load</button>
              <button (click)="initWithPassphrase()" class="btn btn-info btn-sm">Init</button>
              <button (click)="clearStorage()" class="btn btn-error btn-sm">Clear</button>
            </div>
            @if (storageResult()) {
              <div
                class="p-3 rounded-lg text-sm"
                [class.bg-success/10]="storageResult().startsWith('✅')"
                [class.text-success]="storageResult().startsWith('✅')"
                [class.bg-error/10]="storageResult().startsWith('❌')"
                [class.text-error]="storageResult().startsWith('❌')"
              >
                {{ storageResult() }}
              </div>
            }
          </div>
        </div>

        <!-- Input Sanitizer -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              🧹 InputSanitizerService
            </h2>
            <span class="badge badge-info">XSS Protection</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">HTML sanitization and URL validation</p>

          <div class="space-y-3">
            <input
              type="text"
              [(ngModel)]="htmlInput"
              placeholder="<b>Bold</b><script>alert(1)</script>"
              class="input input-bordered input-sm w-full font-mono text-xs"
            />
            <div class="flex gap-2">
              <button (click)="sanitizeHtml()" class="btn btn-primary btn-sm">Sanitize HTML</button>
              <button (click)="escapeHtml()" class="btn btn-secondary btn-sm">Escape</button>
            </div>
            <input
              type="text"
              [(ngModel)]="urlInput"
              placeholder="https://example.com"
              class="input input-bordered input-sm w-full font-mono"
            />
            <button (click)="sanitizeUrl()" class="btn btn-secondary btn-sm">Validate URL</button>

            @if (sanitizedHtml()) {
              <div class="mt-2 p-3 bg-base-300 rounded-lg">
                <p class="text-xs text-secondary m-0 mb-1">Result:</p>
                <code class="text-sm font-mono break-all">{{ sanitizedHtml() }}</code>
              </div>
            }
            @if (sanitizedUrl() !== null) {
              <div
                class="mt-2 p-3 rounded-lg text-sm"
                [class.bg-success/10]="sanitizedUrl()"
                [class.text-success]="sanitizedUrl()"
                [class.bg-error/10]="!sanitizedUrl()"
                [class.text-error]="!sanitizedUrl()"
              >
                {{ sanitizedUrl() ?? 'URL rejected' }}
              </div>
            }
          </div>
        </div>

        <!-- Password Strength -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              🔑 PasswordStrengthService
            </h2>
            <span class="badge badge-success">Entropy Analysis</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Password strength assessment with entropy calculation
          </p>

          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                [(ngModel)]="passwordInput"
                placeholder="Enter password..."
                class="input input-bordered input-sm flex-1 font-mono"
              />
              <button (click)="checkPassword()" class="btn btn-primary btn-sm">
                Check Strength
              </button>
            </div>

            @if (passwordScore() !== null) {
              <div class="p-4 bg-base-300 rounded-lg">
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex gap-1">
                    @for (i of [0, 1, 2, 3, 4]; track i) {
                      <div
                        class="w-8 h-2 rounded-full"
                        [class.bg-success]="i < passwordScore()"
                        [class.bg-base-content/20]="i >= passwordScore()"
                      ></div>
                    }
                  </div>
                  <span
                    class="font-bold text-sm"
                    [class.text-success]="passwordScore() >= 3"
                    [class.text-warning]="passwordScore() === 2"
                    [class.text-error]="passwordScore() <= 1"
                  >
                    {{ passwordLabel() }} ({{ passwordScore() }}/4)
                  </span>
                </div>
                <p class="text-sm text-secondary m-0">
                  Entropy: {{ passwordEntropy() | number }} bits
                </p>
                @if (passwordFeedback().length > 0) {
                  <ul class="mt-2 text-xs text-secondary space-y-1">
                    @for (tip of passwordFeedback(); track tip) {
                      <li>• {{ tip }}</li>
                    }
                  </ul>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="mt-8 bg-base-200 border border-base-300 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-base-content m-0">Activity Log</h2>
          <button
            (click)="clearLogs()"
            class="btn btn-ghost btn-sm"
            [disabled]="logs().length === 0"
          >
            Clear
          </button>
        </div>

        @if (logs().length === 0) {
          <p class="text-sm text-base-content/40 text-center py-8">
            No activity yet. Try the demos above!
          </p>
        } @else {
          <div class="space-y-2 max-h-64 overflow-y-auto">
            @for (log of logs(); track log.id) {
              <div
                class="flex items-center gap-3 p-3 rounded-lg text-sm"
                [class.bg-success/10]="log.type === 'success'"
                [class.border-l-4]="true"
                [class.border-success]="log.type === 'success'"
                [class.border-error]="log.type === 'error'"
                [class.border-info]="log.type === 'info'"
              >
                <span class="text-xs font-mono text-base-content/40">{{ log.time }}</span>
                <span class="badge badge-xs" [class.badge-primary]="true">{{ log.section }}</span>
                <span class="flex-1 break-all">{{ log.message }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class SecurityDemoComponent implements OnDestroy {
  // --- Regex Security state ---
  protected readonly regexPattern = signal<string>(
    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  );
  protected readonly regexInput = signal<string>('test@example.com');
  protected readonly regexResult = signal<string>('');
  protected readonly regexTime = signal<number>(0);
  protected readonly regexStatus = signal<'idle' | 'running' | 'done' | 'error'>('idle');

  // --- WebCrypto state ---
  protected readonly hashResult = signal<string>('');
  protected readonly hmacSignature = signal<string>('');
  protected readonly hmacVerified = signal<boolean | null>(null);
  protected readonly encryptedData = signal<string>('');
  protected readonly decryptedData = signal<string>('');

  // --- SecureStorage state ---
  protected readonly storageKey = signal<string>('demo-key');
  protected readonly storageValue = signal<string>('{"message": "Hello, World!"}');
  protected readonly storageResult = signal<string>('');
  protected readonly passphrase = signal<string>('my-secret-passphrase');

  // --- InputSanitizer state ---
  protected readonly htmlInput = signal<string>('<b>Bold</b><script>alert(1)</script>');
  protected readonly sanitizedHtml = signal<string>('');
  protected readonly urlInput = signal<string>('https://example.com');
  protected readonly sanitizedUrl = signal<string | null>(null);

  // --- PasswordStrength state ---
  protected readonly passwordInput = signal<string>('P@ssw0rd123!');
  protected readonly passwordScore = signal<number | null>(null);
  protected readonly passwordLabel = signal<string>('');
  protected readonly passwordEntropy = signal<number>(0);
  protected readonly passwordFeedback = signal<string[]>([]);

  // --- Shared log ---
  protected readonly logs = signal<LogEntry[]>([]);
  private logCounter = 0;

  constructor(
    private regexSecurity: RegexSecurityService,
    private webCrypto: WebCryptoService,
    private secureStorage: SecureStorageService,
    private inputSanitizer: InputSanitizerService,
    private passwordStrength: PasswordStrengthService,
  ) {}

  // ──────────────────────────────────────────────────────
  // Regex Security tests
  // ──────────────────────────────────────────────────────

  async testRegex(): Promise<void> {
    this.regexStatus.set('running');
    const start = performance.now();

    try {
      const result = await this.regexSecurity.testRegex(this.regexPattern(), this.regexInput(), {
        timeout: 3000,
        safeMode: true,
      });

      const elapsed = Math.round(performance.now() - start);
      this.regexTime.set(elapsed);

      if (result.timeout) {
        this.regexResult.set('⚠️ Timeout - possible ReDoS attack');
        this.regexStatus.set('error');
        this.log('Regex', 'Timeout - possible ReDoS', 'error');
      } else {
        this.regexResult.set(`Match: ${result.match ? '✅ YES' : '❌ NO'}`);
        this.regexStatus.set('done');
        this.log(
          'Regex',
          `Pattern ${result.match ? 'matched' : 'did not match'} in ${elapsed}ms`,
          'success',
        );
      }
    } catch (err) {
      this.regexStatus.set('error');
      this.regexResult.set(`Error: ${err}`);
      this.log('Regex', `Error: ${err}`, 'error');
    }
  }

  async analyzePattern(): Promise<void> {
    try {
      const analysis = await this.regexSecurity.analyzePatternSecurity(this.regexPattern());
      this.regexResult.set(`Risk: ${analysis.risk} | Safe: ${analysis.safe ? '✅' : '❌'}`);
      this.log(
        'Regex',
        `Pattern analysis: ${analysis.risk} risk`,
        analysis.safe ? 'success' : 'error',
      );
    } catch (err) {
      this.log('Regex', `Analysis error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // WebCrypto tests
  // ──────────────────────────────────────────────────────

  async hashData(): Promise<void> {
    try {
      const data = 'data-to-hash-' + Date.now();
      const hash = await this.webCrypto.hash(data, 'SHA-256');
      this.hashResult.set(hash.substring(0, 32) + '...');
      this.log('Crypto', `SHA-256: ${hash.substring(0, 16)}...`, 'success');
    } catch (err) {
      this.log('Crypto', `Hash error: ${err}`, 'error');
    }
  }

  async generateHmac(): Promise<void> {
    try {
      const key = await this.webCrypto.generateHmacKey('HMAC-SHA-256');
      const data = 'message-to-sign-' + Date.now();
      const signature = await this.webCrypto.sign(key, data);
      this.hmacSignature.set(signature.substring(0, 32) + '...');
      this.hmacVerified.set(null);
      this.log('Crypto', `HMAC signature: ${signature.substring(0, 16)}...`, 'success');
    } catch (err) {
      this.log('Crypto', `HMAC error: ${err}`, 'error');
    }
  }

  async encryptAes(): Promise<void> {
    try {
      const key = await this.webCrypto.generateAesKey(256);
      const data = 'Sensitive data to encrypt';
      const { ciphertext, iv: _iv } = await this.webCrypto.encryptAes(key, data);
      const hex = Array.from(new Uint8Array(ciphertext))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      this.encryptedData.set(hex.substring(0, 40) + '...');
      this.decryptedData.set('');
      this.log('Crypto', `AES encrypted: ${hex.substring(0, 20)}...`, 'success');
    } catch (err) {
      this.log('Crypto', `Encrypt error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // SecureStorage tests
  // ──────────────────────────────────────────────────────

  async storeData(): Promise<void> {
    try {
      await this.secureStorage.set(this.storageKey(), JSON.parse(this.storageValue()));
      this.storageResult.set('✅ Data stored successfully');
      this.log('Storage', 'Data encrypted and stored', 'success');
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
      this.log('Storage', `Store error: ${err}`, 'error');
    }
  }

  async retrieveData(): Promise<void> {
    try {
      const data = await this.secureStorage.get<unknown>(this.storageKey());
      if (data) {
        this.storageResult.set(`✅ Retrieved: ${JSON.stringify(data)}`);
        this.log('Storage', 'Data retrieved and decrypted', 'success');
      } else {
        this.storageResult.set('❌ No data found');
        this.log('Storage', 'No data found for key', 'error');
      }
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
      this.log('Storage', `Retrieve error: ${err}`, 'error');
    }
  }

  async initWithPassphrase(): Promise<void> {
    try {
      await this.secureStorage.initWithPassphrase(this.passphrase());
      this.storageResult.set('✅ Passphrase initialized - data will persist');
      this.log('Storage', 'Passphrase key derivation complete', 'success');
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
      this.log('Storage', `Passphrase error: ${err}`, 'error');
    }
  }

  clearStorage(): void {
    this.secureStorage.clear();
    this.storageResult.set('✅ Storage cleared');
    this.log('Storage', 'All storage cleared', 'info');
  }

  // ──────────────────────────────────────────────────────
  // InputSanitizer tests
  // ──────────────────────────────────────────────────────

  sanitizeHtml(): void {
    const result = this.inputSanitizer.sanitizeHtml(this.htmlInput());
    this.sanitizedHtml.set(result);
    this.log('Sanitizer', `HTML sanitized: ${result.length} chars`, 'success');
  }

  sanitizeUrl(): void {
    const result = this.inputSanitizer.sanitizeUrl(this.urlInput());
    this.sanitizedUrl.set(result);
    this.log('Sanitizer', `URL: ${result ?? 'rejected'}`, result ? 'success' : 'error');
  }

  escapeHtml(): void {
    const result = this.inputSanitizer.escapeHtml(this.htmlInput());
    this.sanitizedHtml.set(result);
    this.log('Sanitizer', `HTML escaped: ${result.length} chars`, 'success');
  }

  // ──────────────────────────────────────────────────────
  // PasswordStrength tests
  // ──────────────────────────────────────────────────────

  checkPassword(): void {
    const result = this.passwordStrength.assess(this.passwordInput());
    this.passwordScore.set(result.score);
    this.passwordLabel.set(result.label);
    this.passwordEntropy.set(result.entropy);
    this.passwordFeedback.set(result.feedback);
    this.log(
      'Password',
      `Score: ${result.score}/4 (${result.label})`,
      result.score >= 3 ? 'success' : 'info',
    );
  }

  // ──────────────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────────────

  clearLogs(): void {
    this.logs.set([]);
  }

  private log(section: string, message: string, type: LogEntry['type']): void {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      fractionalSecondDigits: 3,
    });
    const id = this.logCounter++;
    this.logs.update((prev) => [{ id, time, section, message, type }, ...prev]);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
