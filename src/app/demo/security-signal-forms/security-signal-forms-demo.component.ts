import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField, form, required } from '@angular/forms/signals';
import {
  hibpPassword,
  noScriptInjection,
  safeHtml,
  safeUrl,
  strongPassword,
} from '@angular-helpers/security/signal-forms';

interface SignupModel {
  email: string;
  password: string;
  bio: string;
  homepage: string;
}

@Component({
  selector: 'app-security-signal-forms-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <header class="mb-8">
        <div class="flex flex-wrap items-center gap-3 mb-3">
          <span class="text-4xl">🧪</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold m-0">Signal Forms Validators</h1>
            <p class="text-sm sm:text-base text-base-content/80 m-0 mt-1">
              Angular v21 Signal Forms bridge from
              <code>@angular-helpers/security/signal-forms</code>
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary badge-md">strongPassword</span>
          <span class="badge badge-accent badge-md">hibpPassword</span>
          <span class="badge badge-info badge-md">safeHtml</span>
          <span class="badge badge-info badge-md">safeUrl</span>
          <span class="badge badge-warning badge-md">noScriptInjection</span>
        </div>
      </header>

      <div class="bg-base-200 border border-base-300 rounded-xl p-6" data-testid="sf-card">
        <form class="space-y-4">
          <div>
            <label class="label text-xs font-semibold" for="sf-email">Email</label>
            <input
              id="sf-email"
              type="email"
              [formField]="f.email"
              class="input input-bordered input-sm w-full"
              data-testid="sf-email"
            />
            @if (f.email().touched() && f.email().invalid()) {
              @for (err of f.email().errors(); track err) {
                <p class="text-xs text-error mt-1" data-testid="sf-email-error">
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div>
            <label class="label text-xs font-semibold" for="sf-password">Password</label>
            <input
              id="sf-password"
              type="password"
              [formField]="f.password"
              class="input input-bordered input-sm w-full"
              data-testid="sf-password"
            />
            @if (f.password().pending()) {
              <p class="text-xs opacity-70 mt-1" data-testid="sf-password-pending">
                <span class="loading loading-spinner loading-xs"></span>
                Checking breach corpus…
              </p>
            }
            @if (f.password().touched() && f.password().invalid()) {
              @for (err of f.password().errors(); track err) {
                <p class="text-xs text-error mt-1" data-testid="sf-password-error">
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div>
            <label class="label text-xs font-semibold" for="sf-bio">Bio (safe HTML)</label>
            <input
              id="sf-bio"
              type="text"
              [formField]="f.bio"
              class="input input-bordered input-sm w-full"
              data-testid="sf-bio"
            />
            @if (f.bio().touched() && f.bio().invalid()) {
              @for (err of f.bio().errors(); track err) {
                <p class="text-xs text-error mt-1" data-testid="sf-bio-error">
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div>
            <label class="label text-xs font-semibold" for="sf-homepage">Homepage URL</label>
            <input
              id="sf-homepage"
              type="url"
              [formField]="f.homepage"
              class="input input-bordered input-sm w-full"
              data-testid="sf-homepage"
            />
            @if (f.homepage().touched() && f.homepage().invalid()) {
              @for (err of f.homepage().errors(); track err) {
                <p class="text-xs text-error mt-1" data-testid="sf-homepage-error">
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div
            class="pt-3 border-t border-base-300 flex items-center justify-between text-xs"
            data-testid="sf-status"
          >
            <span>form valid: <strong>{{ f().valid() }}</strong></span>
            <span>pending: <strong>{{ f().pending() }}</strong></span>
            <span>dirty: <strong>{{ f().dirty() }}</strong></span>
          </div>
          <pre
            class="bg-base-300 rounded p-3 text-xs font-mono overflow-auto"
            data-testid="sf-value"
          >{{ currentValue() | json }}</pre>
        </form>
      </div>

      <p class="text-xs opacity-70 mt-4">
        This demo uses the Angular v21 Signal Forms API ({{ '@angular/forms/signals' }}). Password
        validation combines the sync <code>strongPassword</code> rule and the async
        <code>hibpPassword</code> rule, which calls Have I Been Pwned via k-anonymity.
      </p>
    </div>
  `,
})
export class SecuritySignalFormsDemoComponent {
  readonly model = signal<SignupModel>({
    email: '',
    password: '',
    bio: '',
    homepage: '',
  });

  readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Email is required' });
    required(p.password, { message: 'Password is required' });
    strongPassword(p.password, { minScore: 3 });
    hibpPassword(p.password);
    safeHtml(p.bio);
    noScriptInjection(p.bio);
    safeUrl(p.homepage, { schemes: ['https:'] });
  });

  readonly currentValue = computed(() => this.model());
}
