import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SecurityValidators } from '@angular-helpers/security/forms';
import {
  CsrfService,
  HibpService,
  JwtService,
  RateLimiterService,
  SensitiveClipboardService,
} from '@angular-helpers/security';

interface DemoLog {
  id: number;
  time: string;
  section: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

@Component({
  selector: 'app-security-utilities-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header class="mb-8 sm:mb-12">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-4xl">🧰</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-base-content m-0">
              Security Utilities Demo
            </h1>
            <p class="text-sm sm:text-base text-base-content/80 m-0 mt-1">
              Reactive Forms validators, JWT, HIBP, CSRF, rate limiting, and more
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary badge-md">Validators</span>
          <span class="badge badge-secondary badge-md">JWT</span>
          <span class="badge badge-accent badge-md">HIBP</span>
          <span class="badge badge-info badge-md">Rate Limiter</span>
          <span class="badge badge-warning badge-md">CSRF</span>
          <span class="badge badge-success badge-md">Clipboard</span>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Reactive Forms validators -->
        <div
          class="bg-base-200 border border-base-300 rounded-xl p-6"
          data-testid="validators-card"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold m-0 flex items-center gap-2">✅ SecurityValidators</h2>
            <span class="badge badge-primary">Reactive Forms</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Sub-entry <code>@angular-helpers/security/forms</code>.
          </p>

          <form [formGroup]="form" class="space-y-3">
            <div>
              <label class="label text-xs" for="validators-password">Password (min score 3)</label>
              <input
                id="validators-password"
                type="password"
                formControlName="password"
                class="input input-bordered input-sm w-full"
                data-testid="validators-password"
              />
              @if (passwordErrors(); as errors) {
                @if (errors['weakPassword']) {
                  <p class="text-xs text-error mt-1" data-testid="validators-password-weak">
                    Score {{ errors['weakPassword'].score }} / required
                    {{ errors['weakPassword'].required }}
                  </p>
                }
              }
            </div>

            <div>
              <label class="label text-xs" for="validators-bio">Bio (safe HTML only)</label>
              <input
                id="validators-bio"
                type="text"
                formControlName="bio"
                class="input input-bordered input-sm w-full"
                data-testid="validators-bio"
              />
              @if (form.controls.bio.errors?.['unsafeHtml']) {
                <p class="text-xs text-error mt-1" data-testid="validators-bio-unsafe">
                  Unsafe HTML detected
                </p>
              }
            </div>

            <div>
              <label class="label text-xs" for="validators-homepage">Homepage (https only)</label>
              <input
                id="validators-homepage"
                type="url"
                formControlName="homepage"
                class="input input-bordered input-sm w-full"
                data-testid="validators-homepage"
              />
              @if (form.controls.homepage.errors?.['unsafeUrl']) {
                <p class="text-xs text-error mt-1" data-testid="validators-homepage-unsafe">
                  Scheme not allowed
                </p>
              }
            </div>

            <div class="text-xs opacity-70" data-testid="validators-status">
              form valid: {{ form.valid }}
            </div>
          </form>
        </div>

        <!-- JWT -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6" data-testid="jwt-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold m-0 flex items-center gap-2">🔎 JwtService</h2>
            <span class="badge badge-secondary">Decode only</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Decode JWT payload and inspect expiration. <strong>Does not verify signature.</strong>
          </p>

          <textarea
            [(ngModel)]="jwtInput"
            placeholder="Paste a JWT here"
            class="textarea textarea-bordered textarea-sm w-full font-mono text-xs"
            rows="3"
            data-testid="jwt-input"
          ></textarea>
          <button
            class="btn btn-primary btn-sm mt-2"
            (click)="inspectJwt()"
            data-testid="jwt-inspect"
          >
            Inspect
          </button>

          @if (jwtResult(); as r) {
            <div class="mt-3 text-xs space-y-1" data-testid="jwt-result">
              <div>
                expired: <strong>{{ r.expired }}</strong>
              </div>
              <div>
                expires in: <strong>{{ r.expiresIn }}ms</strong>
              </div>
              <div>
                sub: <code>{{ r.sub ?? 'null' }}</code>
              </div>
            </div>
          }
          @if (jwtError(); as err) {
            <p class="text-xs text-error mt-2" data-testid="jwt-error">{{ err }}</p>
          }
        </div>

        <!-- HIBP -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6" data-testid="hibp-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold m-0 flex items-center gap-2">💧 HibpService</h2>
            <span class="badge badge-accent">k-anonymity</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Only the first 5 hex chars of the SHA-1 hash leave the browser.
          </p>

          <input
            type="password"
            [(ngModel)]="hibpInput"
            placeholder="Password to check"
            class="input input-bordered input-sm w-full"
            data-testid="hibp-input"
          />
          <button
            class="btn btn-primary btn-sm mt-2"
            (click)="checkHibp()"
            [disabled]="hibpStatus() === 'checking'"
            data-testid="hibp-check"
          >
            @if (hibpStatus() === 'checking') {
              <span class="loading loading-spinner loading-xs"></span>
            }
            Check
          </button>

          @if (hibpResult(); as r) {
            <div class="mt-3 text-xs space-y-1" data-testid="hibp-result">
              <div>
                leaked:
                <strong [class.text-error]="r.leaked" [class.text-success]="!r.leaked">{{
                  r.leaked
                }}</strong>
              </div>
              @if (r.leaked) {
                <div>
                  count: <strong>{{ r.count }}</strong>
                </div>
              }
              @if (r.error) {
                <div class="opacity-70">error: {{ r.error }}</div>
              }
            </div>
          }
        </div>

        <!-- Rate Limiter -->
        <div
          class="bg-base-200 border border-base-300 rounded-xl p-6"
          data-testid="rate-limiter-card"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold m-0 flex items-center gap-2">⏱️ RateLimiterService</h2>
            <span class="badge badge-info">token-bucket</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Policy <code>demo</code>: capacity 3, refill 0.5/s.
          </p>

          <div class="flex items-center gap-3 mb-3">
            <button
              class="btn btn-primary btn-sm"
              (click)="consumeRate()"
              [disabled]="!rateCanExecute()"
              data-testid="rate-consume"
            >
              Consume 1
            </button>
            <button class="btn btn-ghost btn-sm" (click)="resetRate()" data-testid="rate-reset">
              Reset
            </button>
            <span class="text-xs opacity-70" data-testid="rate-remaining">
              remaining: {{ rateRemaining() }}
            </span>
          </div>

          @if (rateAttempts().length) {
            <ul class="text-xs space-y-1" data-testid="rate-log">
              @for (a of rateAttempts(); track a.id) {
                <li [class.text-success]="a.ok" [class.text-error]="!a.ok">
                  {{ a.time }} — {{ a.message }}
                </li>
              }
            </ul>
          }
        </div>

        <!-- CSRF -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6" data-testid="csrf-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold m-0 flex items-center gap-2">🛡️ CsrfService</h2>
            <span class="badge badge-warning">double-submit</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Pair with <code>withCsrfHeader()</code> functional interceptor.
          </p>

          <div class="flex flex-wrap gap-2 mb-3">
            <button
              class="btn btn-primary btn-sm"
              (click)="generateCsrf()"
              data-testid="csrf-generate"
            >
              Generate + Store
            </button>
            <button class="btn btn-ghost btn-sm" (click)="clearCsrf()" data-testid="csrf-clear">
              Clear
            </button>
          </div>

          <div class="font-mono text-xs break-all bg-base-300 rounded p-2" data-testid="csrf-token">
            {{ csrfToken() || '(no token)' }}
          </div>
        </div>

        <!-- Sensitive Clipboard -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6" data-testid="clipboard-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold m-0 flex items-center gap-2">
              📋 SensitiveClipboardService
            </h2>
            <span class="badge badge-success">auto-clear</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Copies and clears the clipboard after a configurable delay, skipping the clear when a
            third party pasted something else.
          </p>

          <input
            type="text"
            [(ngModel)]="clipboardInput"
            placeholder="Sensitive value"
            class="input input-bordered input-sm w-full"
            data-testid="clipboard-input"
          />
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              class="btn btn-primary btn-sm"
              (click)="copySensitive(3000)"
              data-testid="clipboard-copy-3s"
            >
              Copy (3s)
            </button>
            <button
              class="btn btn-ghost btn-sm"
              (click)="cancelClipboard()"
              data-testid="clipboard-cancel"
            >
              Cancel clear
            </button>
          </div>
          <p class="text-xs opacity-70 mt-2" data-testid="clipboard-status">
            status: {{ clipboardStatus() }}
          </p>
        </div>
      </div>

      <!-- Activity log -->
      <section
        class="bg-base-200 border border-base-300 rounded-xl p-6 mt-6"
        data-testid="log-card"
      >
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold m-0">Activity Log</h2>
          <button class="btn btn-ghost btn-xs" (click)="clearLogs()" data-testid="log-clear">
            Clear
          </button>
        </div>
        @if (logs().length) {
          <ul class="space-y-1 text-xs font-mono">
            @for (log of logs(); track log.id) {
              <li
                [class.text-error]="log.type === 'error'"
                [class.text-success]="log.type === 'success'"
              >
                [{{ log.time }}] <strong>{{ log.section }}</strong> — {{ log.message }}
              </li>
            }
          </ul>
        } @else {
          <p class="text-xs opacity-70">No activity yet.</p>
        }
      </section>
    </div>
  `,
})
export class SecurityUtilitiesDemoComponent {
  private readonly jwt = inject(JwtService);
  private readonly hibp = inject(HibpService);
  private readonly rateLimiter = inject(RateLimiterService);
  private readonly csrf = inject(CsrfService);
  private readonly sensitiveClipboard = inject(SensitiveClipboardService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, SecurityValidators.strongPassword({ minScore: 3 })]],
    bio: ['', [SecurityValidators.safeHtml()]],
    homepage: ['', [SecurityValidators.safeUrl({ schemes: ['https:'] })]],
  });

  readonly passwordErrors = computed(() => this.form.controls.password.errors);

  readonly jwtInput = signal('');
  readonly jwtResult = signal<{ expired: boolean; expiresIn: number; sub: string | null } | null>(
    null,
  );
  readonly jwtError = signal<string | null>(null);

  readonly hibpInput = signal('');
  readonly hibpStatus = signal<'idle' | 'checking' | 'done'>('idle');
  readonly hibpResult = signal<{ leaked: boolean; count: number; error?: string } | null>(null);

  readonly rateCanExecute = this.rateLimiter.canExecute('demo');
  readonly rateRemaining = this.rateLimiter.remaining('demo');
  readonly rateAttempts = signal<{ id: number; time: string; ok: boolean; message: string }[]>([]);

  readonly csrfToken = signal<string | null>(null);

  readonly clipboardInput = signal('');
  readonly clipboardStatus = signal('idle');

  readonly logs = signal<DemoLog[]>([]);

  private logCounter = 0;
  private rateCounter = 0;

  constructor() {
    this.rateLimiter.configure('demo', {
      type: 'token-bucket',
      capacity: 3,
      refillPerSecond: 0.5,
    });
    this.csrfToken.set(this.csrf.getToken());
  }

  inspectJwt(): void {
    const token = this.jwtInput().trim();
    if (!token) return;
    try {
      const claims = this.jwt.decode<Record<string, unknown>>(token);
      this.jwtResult.set({
        expired: this.jwt.isExpired(token),
        expiresIn: this.jwt.expiresIn(token),
        sub: typeof claims['sub'] === 'string' ? (claims['sub'] as string) : null,
      });
      this.jwtError.set(null);
      this.log('JWT', 'decoded token', 'success');
    } catch (err) {
      this.jwtResult.set(null);
      this.jwtError.set(err instanceof Error ? err.message : String(err));
      this.log('JWT', `decode error: ${err}`, 'error');
    }
  }

  async checkHibp(): Promise<void> {
    const password = this.hibpInput();
    if (!password) return;
    this.hibpStatus.set('checking');
    try {
      const result = await this.hibp.isPasswordLeaked(password);
      this.hibpResult.set(result);
      this.hibpStatus.set('done');
      this.log('HIBP', `leaked=${result.leaked} count=${result.count}`, 'info');
    } catch (err) {
      this.hibpStatus.set('idle');
      this.log('HIBP', `error: ${err}`, 'error');
    }
  }

  async consumeRate(): Promise<void> {
    const entryId = ++this.rateCounter;
    try {
      await this.rateLimiter.consume('demo');
      this.rateAttempts.update((entries) => [
        { id: entryId, time: this.timestamp(), ok: true, message: 'consumed 1' },
        ...entries.slice(0, 9),
      ]);
    } catch (err) {
      this.rateAttempts.update((entries) => [
        {
          id: entryId,
          time: this.timestamp(),
          ok: false,
          message: err instanceof Error ? err.message : String(err),
        },
        ...entries.slice(0, 9),
      ]);
    }
  }

  resetRate(): void {
    this.rateLimiter.reset('demo');
    this.rateAttempts.set([]);
  }

  generateCsrf(): void {
    const token = this.csrf.generateToken();
    this.csrf.storeToken(token);
    this.csrfToken.set(token);
    this.log('CSRF', `token stored (${token.length} hex chars)`, 'success');
  }

  clearCsrf(): void {
    this.csrf.clearToken();
    this.csrfToken.set(null);
    this.log('CSRF', 'token cleared', 'info');
  }

  async copySensitive(clearAfterMs: number): Promise<void> {
    const value = this.clipboardInput();
    if (!value) return;
    this.clipboardStatus.set('copying');
    try {
      await this.sensitiveClipboard.copy(value, { clearAfterMs });
      this.clipboardStatus.set(`copied — clearing in ${clearAfterMs}ms`);
      this.log('Clipboard', `copied, auto-clear ${clearAfterMs}ms`, 'success');
    } catch (err) {
      this.clipboardStatus.set('error');
      this.log('Clipboard', `error: ${err}`, 'error');
    }
  }

  cancelClipboard(): void {
    this.sensitiveClipboard.cancelPendingClear();
    this.clipboardStatus.set('cancelled');
    this.log('Clipboard', 'pending clear cancelled', 'info');
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  private log(section: string, message: string, type: DemoLog['type']): void {
    this.logs.update((entries) =>
      [{ id: ++this.logCounter, time: this.timestamp(), section, message, type }, ...entries].slice(
        0,
        25,
      ),
    );
  }

  private timestamp(): string {
    return new Date().toISOString().slice(11, 19);
  }
}
