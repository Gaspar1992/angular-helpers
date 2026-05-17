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
  styleUrls: ['../services/demo.styles.css'],
  template: `
    <div class="max-width-container py-12 sm:py-20 animate-in fade-in duration-700">
      <header class="mb-16 text-center sm:text-left">
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-5 mb-8">
          <div class="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-5xl shadow-2xl border border-primary/20 ring-1 ring-primary/10">
            🧪
          </div>
          <div>
            <h1 class="text-3xl sm:text-5xl font-black text-base-content m-0 tracking-tighter">Signal Forms Validators</h1>
            <p class="text-lg text-base-content/50 m-0 mt-2 font-medium leading-relaxed">
              Angular Signal Forms bridge from
              <code class="bg-primary/10 px-2 py-0.5 rounded-lg text-primary font-bold border border-primary/10">@angular-helpers/security/signal-forms</code>
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2.5 justify-center sm:justify-start">
          <span class="badge badge-primary font-black">strongPassword</span>
          <span class="badge badge-accent font-black">hibpPassword</span>
          <span class="badge badge-info font-black">safeHtml</span>
          <span class="badge badge-info font-black">safeUrl</span>
          <span class="badge badge-warning font-black">noScriptInjection</span>
        </div>
      </header>

      <div class="svc-card max-w-3xl mx-auto" data-testid="sf-card">
        <h2 class="svc-card-title mb-10">
          <span class="w-2 h-8 bg-primary rounded-full"></span>
          Secure Registration Form
        </h2>
        
        <form class="space-y-8">
          <div class="space-y-2">
            <label for="sf-email">Email Address</label>
            <input
              id="sf-email"
              type="email"
              [formField]="f.email"
              placeholder="user@example.com"
              class="demo-input w-full"
              data-testid="sf-email"
            />
            @if (f.email().touched() && f.email().invalid()) {
              @for (err of f.email().errors(); track err) {
                <p class="text-[11px] text-error font-black uppercase tracking-widest mt-2 flex items-center gap-2" data-testid="sf-email-error">
                  <span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div class="space-y-2">
            <label for="sf-password">Secure Password</label>
            <input
              id="sf-password"
              type="password"
              [formField]="f.password"
              placeholder="••••••••"
              class="demo-input w-full font-mono"
              data-testid="sf-password"
            />
            @if (f.password().pending()) {
              <p class="text-[11px] text-info font-black uppercase tracking-widest mt-2 flex items-center gap-2" data-testid="sf-password-pending">
                <span class="spinner w-3 h-3"></span>
                Checking breach corpus…
              </p>
            }
            @if (f.password().touched() && f.password().invalid()) {
              @for (err of f.password().errors(); track err) {
                <p class="text-[11px] text-error font-black uppercase tracking-widest mt-2 flex items-center gap-2" data-testid="sf-password-error">
                  <span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div class="space-y-2">
            <label for="sf-bio">Bio (Safe HTML Allowed)</label>
            <input
              id="sf-bio"
              type="text"
              [formField]="f.bio"
              placeholder="Tell us about yourself..."
              class="demo-input w-full"
              data-testid="sf-bio"
            />
            @if (f.bio().touched() && f.bio().invalid()) {
              @for (err of f.bio().errors(); track err) {
                <p class="text-[11px] text-error font-black uppercase tracking-widest mt-2 flex items-center gap-2" data-testid="sf-bio-error">
                  <span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div class="space-y-2">
            <label for="sf-homepage">Homepage URL</label>
            <input
              id="sf-homepage"
              type="url"
              [formField]="f.homepage"
              placeholder="https://..."
              class="demo-input w-full font-mono"
              data-testid="sf-homepage"
            />
            @if (f.homepage().touched() && f.homepage().invalid()) {
              @for (err of f.homepage().errors(); track err) {
                <p class="text-[11px] text-error font-black uppercase tracking-widest mt-2 flex items-center gap-2" data-testid="sf-homepage-error">
                  <span class="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                  {{ err.message ?? err.kind }}
                </p>
              }
            }
          </div>

          <div
            class="mt-12 pt-8 border-t border-base-content/5 flex items-center justify-between"
            data-testid="sf-status"
          >
            <div class="flex gap-6">
              <div class="flex flex-col">
                <span class="text-[10px] text-base-content/30 uppercase font-black tracking-widest">Valid</span>
                <span class="font-black text-sm" [class.text-success]="f().valid()" [class.text-error]="!f().valid()">{{ f().valid() ? 'YES' : 'NO' }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] text-base-content/30 uppercase font-black tracking-widest">Pending</span>
                <span class="font-black text-sm text-info">{{ f().pending() ? 'SYNC...' : 'DONE' }}</span>
              </div>
            </div>
            
            <button class="btn btn-primary font-black px-10 shadow-2xl" [disabled]="!f().valid()">
              Submit Registration
            </button>
          </div>
          
          <div class="mt-8 p-6 bg-base-content/5 rounded-2xl border border-base-content/5 shadow-inner">
            <span class="text-[10px] text-base-content/30 uppercase font-black block mb-4 tracking-widest">Real-time Model State</span>
            <pre
              class="text-[11px] font-mono overflow-auto text-primary leading-relaxed font-black"
              data-testid="sf-value"
            >{{ currentValue() | json }}</pre>
          </div>
        </form>
      </div>

      <div class="mt-16 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 max-w-3xl mx-auto shadow-2xl">
        <h3 class="text-base-content font-black mb-4 flex items-center gap-3">
           <span class="text-2xl">ℹ️</span> Technical Implementation
        </h3>
        <p class="text-sm text-base-content/50 leading-relaxed font-medium">
          This demo utilizes the cutting-edge <strong class="text-base-content">Angular Signal Forms API</strong>. 
          Password validation is performed via a composite strategy: synchronous entropy analysis (<code class="text-primary font-bold">strongPassword</code>) 
          and asynchronous k-anonymity breach verification (<code class="text-accent font-bold">hibpPassword</code>).
        </p>
      </div>
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

    // Custom security validators
    strongPassword(p.password, { minScore: 3 });
    hibpPassword(p.password);

    // Sanitization and injection checks
    safeHtml(p.bio);
    noScriptInjection(p.bio);
    safeUrl(p.homepage, { schemes: ['https:'] });
  });

  readonly currentValue = computed(() => this.model());
}
