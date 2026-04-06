import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RegexSecurityService } from '@angular-helpers/security';
import { WebCryptoService } from '@angular-helpers/security';
import { SecureStorageService } from '@angular-helpers/security';
import { InputSanitizerService } from '@angular-helpers/security';
import { PasswordStrengthService } from '@angular-helpers/security';

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
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../services/demo.styles.css',
  templateUrl: './security-demo.component.html',
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
