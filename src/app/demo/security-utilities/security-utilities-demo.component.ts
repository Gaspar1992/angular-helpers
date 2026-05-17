import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  styleUrls: ['../services/demo.styles.css'],
  template: `
    <div class="max-width-container py-12 sm:py-20 animate-in fade-in duration-700">
      <header class="mb-16 text-center sm:text-left">
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-5 mb-8">
          <div
            class="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-5xl shadow-2xl border border-primary/20 ring-1 ring-primary/10"
          >
            🧰
          </div>
          <div>
            <h1 class="text-3xl sm:text-5xl font-black text-base-content m-0 tracking-tighter">
              Security Utilities
            </h1>
            <p class="text-lg text-base-content/50 m-0 mt-2 font-medium leading-relaxed">
              Reactive Forms validators, JWT, HIBP, CSRF, rate limiting, and more.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2.5 justify-center sm:justify-start">
          <span class="badge badge-primary font-black">Validators</span>
          <span class="badge badge-secondary font-black">JWT</span>
          <span class="badge badge-accent font-black">HIBP</span>
          <span class="badge badge-info font-black">Rate Limiter</span>
          <span class="badge badge-warning font-black">CSRF</span>
          <span class="badge badge-success font-black">Clipboard</span>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <!-- Reactive Forms validators -->
        <section class="svc-card" data-testid="validators-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-primary text-3xl">✅</span> SecurityValidators
            </h2>
            <span class="badge badge-outline border-primary/30 text-primary font-bold"
              >Reactive Forms</span
            >
          </div>
          <p class="svc-desc">
            Sub-entry
            <code
              class="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10"
              >@angular-helpers/security/forms</code
            >.
          </p>

          <form [formGroup]="form" class="space-y-6">
            <div class="space-y-2">
              <label for="validators-password">Password (min score 3)</label>
              <input
                id="validators-password"
                type="password"
                formControlName="password"
                class="demo-input w-full font-mono"
                data-testid="validators-password"
              />
              @if (form.controls.password.errors?.['weakPassword']; as weak) {
                <p
                  class="text-[11px] text-error font-black uppercase tracking-widest mt-2 flex items-center gap-2"
                  data-testid="validators-password-weak"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  Score {{ weak.score }} / required {{ weak.required }}
                </p>
              }
            </div>

            <div class="space-y-2">
              <label for="validators-bio">Bio (safe HTML only)</label>
              <input
                id="validators-bio"
                type="text"
                formControlName="bio"
                class="demo-input w-full"
                data-testid="validators-bio"
              />
              @if (form.controls.bio.errors?.['unsafeHtml']) {
                <p
                  class="text-[11px] text-error font-black uppercase tracking-widest mt-2 flex items-center gap-2"
                  data-testid="validators-bio-unsafe"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  Unsafe HTML detected
                </p>
              }
            </div>

            <div class="space-y-2">
              <label for="validators-homepage">Homepage (https only)</label>
              <input
                id="validators-homepage"
                type="url"
                formControlName="homepage"
                class="demo-input w-full font-mono"
                data-testid="validators-homepage"
              />
              @if (form.controls.homepage.errors?.['unsafeUrl']) {
                <p
                  class="text-[11px] text-error font-black uppercase tracking-widest mt-2 flex items-center gap-2"
                  data-testid="validators-homepage-unsafe"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  Scheme not allowed
                </p>
              }
            </div>

            <div
              class="mt-10 p-5 bg-base-content/5 rounded-[2rem] border border-base-content/5 shadow-inner flex items-center justify-between"
              data-testid="validators-status"
            >
              <span class="text-[10px] font-black text-base-content/30 uppercase tracking-[0.2em]"
                >Form Status</span
              >
              <span
                class="badge font-black px-4"
                [class.badge-success]="form.valid"
                [class.badge-error]="!form.valid"
              >
                {{ form.valid ? 'VALID' : 'INVALID' }}
              </span>
            </div>
          </form>
        </section>

        <!-- JWT -->
        <section class="svc-card" data-testid="jwt-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-secondary text-3xl">🔎</span> JwtService
            </h2>
            <span class="badge badge-outline border-secondary/30 text-secondary font-bold"
              >Decode only</span
            >
          </div>
          <p class="svc-desc">
            Decode JWT payload and inspect expiration.
            <span class="text-warning font-bold underline decoration-warning/30 underline-offset-4"
              >Does not verify signature.</span
            >
          </p>

          <textarea
            [(ngModel)]="jwtInput"
            placeholder="Paste a JWT here..."
            class="demo-input w-full font-mono text-xs leading-relaxed"
            rows="5"
            data-testid="jwt-input"
          ></textarea>
          <button
            class="btn btn-primary w-full mt-6 font-black"
            (click)="inspectJwt()"
            data-testid="jwt-inspect"
          >
            Inspect Token
          </button>

          @if (jwtResult(); as r) {
            <div class="mt-8 svc-result space-y-4" data-testid="jwt-result">
              <div class="flex justify-between items-center">
                <span class="kv-key">Expired</span>
                <span
                  class="font-black text-sm uppercase tracking-tighter"
                  [class.text-error]="r.expired"
                  [class.text-success]="!r.expired"
                  >{{ r.expired }}</span
                >
              </div>
              <div class="flex justify-between items-center border-t border-base-content/5 pt-4">
                <span class="kv-key">Expires in</span>
                <span class="font-mono text-base-content font-black">{{ r.expiresIn }}ms</span>
              </div>
              <div class="flex justify-between items-center border-t border-base-content/5 pt-4">
                <span class="kv-key">Subject</span>
                <code class="text-secondary font-black tracking-tight">{{ r.sub ?? 'null' }}</code>
              </div>
            </div>
          }
          @if (jwtError(); as err) {
            <div
              class="mt-6 p-5 bg-error/10 rounded-2xl border border-error/20 flex items-center gap-3 text-xs text-error font-black"
              data-testid="jwt-error"
            >
              <span class="text-2xl">⚠️</span> {{ err }}
            </div>
          }
        </section>

        <!-- HIBP -->
        <section class="svc-card" data-testid="hibp-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title"><span class="text-accent text-3xl">💧</span> HibpService</h2>
            <span class="badge badge-outline border-accent/30 text-accent font-bold"
              >k-anonymity</span
            >
          </div>
          <p class="svc-desc">
            Privacy-preserving breach check. Only the first 5 hex chars of the SHA-1 hash leave the
            browser.
          </p>

          <div class="space-y-6">
            <div class="space-y-2">
              <label>Password to check</label>
              <input
                type="password"
                [(ngModel)]="hibpInput"
                placeholder="Check your sensitive data..."
                class="demo-input w-full"
                data-testid="hibp-input"
              />
            </div>
            <button
              class="btn btn-accent w-full font-black shadow-xl shadow-accent/10"
              (click)="checkHibp()"
              [disabled]="hibpStatus() === 'checking'"
              data-testid="hibp-check"
            >
              @if (hibpStatus() === 'checking') {
                <span class="spinner"></span>
              }
              Scan for Breaches
            </button>
          </div>

          @if (hibpResult(); as r) {
            <div class="mt-10 svc-result space-y-4" data-testid="hibp-result">
              <div class="flex justify-between items-center">
                <span class="kv-key">Scan Status</span>
                <span
                  class="badge font-black px-4"
                  [class.badge-error]="r.leaked"
                  [class.badge-success]="!r.leaked"
                >
                  {{ r.leaked ? 'BREACHED' : 'SAFE' }}
                </span>
              </div>
              @if (r.leaked) {
                <div class="flex justify-between items-center border-t border-base-content/5 pt-4">
                  <span class="kv-key text-error/60">Incident Count</span>
                  <span class="text-error font-mono font-black text-lg tracking-tighter">{{
                    r.count | number
                  }}</span>
                </div>
              }
              @if (r.error) {
                <div class="text-xs text-error mt-4 italic font-bold">{{ r.error }}</div>
              }
            </div>
          }
        </section>

        <!-- Rate Limiter -->
        <section class="svc-card" data-testid="rate-limiter-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-info text-3xl">⏱️</span> RateLimiterService
            </h2>
            <span class="badge badge-outline border-info/30 text-info font-bold">token-bucket</span>
          </div>
          <p class="svc-desc">
            Client-side rate limiting with policy
            <code
              class="text-info font-bold bg-info/10 px-1.5 py-0.5 rounded-lg border border-info/10"
              >demo</code
            >
            (3 tokens, 0.5/s refill).
          </p>

          <div class="flex items-center gap-4 mb-8">
            <button
              class="btn btn-primary font-black flex-1 shadow-lg shadow-primary/20"
              (click)="consumeRate()"
              [disabled]="!rateCanExecute()"
              data-testid="rate-consume"
            >
              Consume 1 Token
            </button>
            <button
              class="btn btn-ghost border border-base-content/10 font-bold px-6"
              (click)="resetRate()"
              data-testid="rate-reset"
            >
              Reset
            </button>
          </div>

          <div class="svc-result">
            <div class="flex justify-between items-center mb-6">
              <span class="kv-key">Bucket Capacity</span>
              <span
                class="text-info font-mono font-black text-2xl tracking-tighter"
                data-testid="rate-remaining"
                >{{ rateRemaining() }}</span
              >
            </div>

            @if (rateAttempts().length) {
              <ul class="list-none p-0 m-0 space-y-3" data-testid="rate-log">
                @for (a of rateAttempts(); track a.id) {
                  <li
                    class="text-xs flex items-center gap-3 p-3 rounded-xl bg-base-content/5 border border-base-content/5 animate-in slide-in-from-left-2 duration-300"
                    [class.text-success]="a.ok"
                    [class.text-error]="!a.ok"
                  >
                    <span class="text-[10px] opacity-30 font-mono tracking-tighter">{{
                      a.time
                    }}</span>
                    <span class="font-bold flex-1 tracking-tight">{{ a.message }}</span>
                    @if (a.ok) {
                      <span class="text-lg">✅</span>
                    } @else {
                      <span class="text-lg">❌</span>
                    }
                  </li>
                }
              </ul>
            }
          </div>
        </section>

        <!-- CSRF -->
        <section class="svc-card" data-testid="csrf-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-warning text-3xl">🛡️</span> CsrfService
            </h2>
            <span class="badge badge-outline border-warning/30 text-warning font-bold"
              >double-submit</span
            >
          </div>
          <p class="svc-desc">
            Pair with
            <code
              class="text-warning font-bold bg-warning/10 px-1.5 py-0.5 rounded-lg border border-warning/10"
              >withCsrfHeader()</code
            >
            interceptor for zero-config XSRF defense.
          </p>

          <div class="flex flex-wrap gap-4 mb-8">
            <button
              class="btn btn-primary font-black flex-1 shadow-lg shadow-primary/20"
              (click)="generateCsrf()"
              data-testid="csrf-generate"
            >
              Generate Token
            </button>
            <button
              class="btn btn-secondary border-base-content/10 font-bold flex-1"
              (click)="clearCsrf()"
              data-testid="csrf-clear"
            >
              Clear Storage
            </button>
          </div>

          <div class="svc-result">
            <span class="kv-key block mb-3">Double-Submit Token</span>
            <div
              class="font-mono text-[10px] break-all text-base-content/70 leading-relaxed font-bold tracking-tight bg-base-content/5 p-4 rounded-xl shadow-inner border border-base-content/5"
              data-testid="csrf-token"
            >
              {{ csrfToken() || '(no token currently stored)' }}
            </div>
          </div>
        </section>

        <!-- Sensitive Clipboard -->
        <section class="svc-card" data-testid="clipboard-card">
          <div class="svc-card-head">
            <h2 class="svc-card-title">
              <span class="text-success text-3xl">📋</span> SensitiveClipboard
            </h2>
            <span class="badge badge-outline border-success/30 text-success font-bold"
              >auto-clear</span
            >
          </div>
          <p class="svc-desc">
            Copies and clears the clipboard after a delay, skipping the clear if third party content
            was detected.
          </p>

          <div class="space-y-6">
            <div class="space-y-2">
              <label>Secret Value</label>
              <input
                type="text"
                [(ngModel)]="clipboardInput"
                placeholder="Enter password to copy..."
                class="demo-input w-full font-mono"
                data-testid="clipboard-input"
              />
            </div>

            <div class="flex flex-wrap gap-4">
              <button
                class="btn btn-primary font-black flex-1 shadow-lg"
                (click)="copySensitive(3000)"
                data-testid="clipboard-copy-3s"
              >
                Copy (3s Delay)
              </button>
              <button
                class="btn btn-secondary border-base-content/10 font-bold flex-1"
                (click)="cancelClipboard()"
                data-testid="clipboard-cancel"
              >
                Abort Clear
              </button>
            </div>
          </div>

          <div class="mt-8 svc-result flex items-center justify-between">
            <span class="kv-key">Status</span>
            <span
              class="text-xs font-mono font-black text-success uppercase tracking-widest animate-pulse"
              data-testid="clipboard-status"
              >{{ clipboardStatus() }}</span
            >
          </div>
        </section>
      </div>

      <!-- Activity log -->
      <section class="svc-card mt-16" data-testid="log-card">
        <div class="svc-card-head">
          <h2 class="svc-card-title">System Event Audit</h2>
          <button
            class="btn btn-secondary btn-xs font-black"
            (click)="clearLogs()"
            data-testid="log-clear"
            [disabled]="logs().length === 0"
          >
            Wipe Logs
          </button>
        </div>

        @if (logs().length) {
          <div class="svc-result no-scrollbar max-h-[400px]">
            <ul class="list-none p-0 m-0 space-y-4">
              @for (log of logs(); track log.id) {
                <li
                  class="text-xs flex gap-4 p-4 rounded-2xl hover:bg-base-content/5 transition-all group border border-transparent hover:border-base-content/5 shadow-sm"
                  [class.text-error]="log.type === 'error'"
                  [class.text-success]="log.type === 'success'"
                  [class.text-base-content/60]="log.type === 'info'"
                >
                  <span class="opacity-30 whitespace-nowrap font-mono tracking-tighter"
                    >[{{ log.time }}]</span
                  >
                  <span class="badge badge-primary font-black px-4 shadow-lg shadow-primary/10"
                    >[{{ log.section }}]</span
                  >
                  <span
                    class="flex-1 italic font-bold tracking-tight group-hover:opacity-100 transition-opacity"
                    >{{ log.message }}</span
                  >
                </li>
              }
            </ul>
          </div>
        } @else {
          <div
            class="py-20 text-center bg-base-content/5 rounded-[2.5rem] border border-dashed border-base-content/10 shadow-inner"
          >
            <p class="text-sm text-base-content/20 font-black uppercase tracking-[0.3em] italic">
              Audit log empty
            </p>
          </div>
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
