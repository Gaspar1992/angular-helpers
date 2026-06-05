import { Component, OnInit, input, signal } from '@angular/core';
import { RegexSecurityDemoComponent } from '../services/regex-security/regex-security-demo.component';
import { WebCryptoDemoComponent } from '../services/web-crypto/web-crypto-demo.component';
import { SecureStorageDemoComponent } from '../services/secure-storage/secure-storage-demo.component';
import { InputSanitizerDemoComponent } from '../services/input-sanitizer/input-sanitizer-demo.component';
import { PasswordStrengthDemoComponent } from '../services/password-strength/password-strength-demo.component';

export type SecurityDemoTab = 'regex' | 'crypto' | 'storage' | 'sanitizer' | 'password';

@Component({
  selector: 'app-security',
  imports: [
    RegexSecurityDemoComponent,
    WebCryptoDemoComponent,
    SecureStorageDemoComponent,
    InputSanitizerDemoComponent,
    PasswordStrengthDemoComponent,
  ],
  template: `
    <div
      class="max-width-container py-12 sm:py-20 animate-in fade-in duration-700"
      [class.demo-embedded]="embedded()"
    >
      @if (!embedded()) {
        <header class="mb-16 text-center sm:text-left">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-5 mb-8">
            <div
              class="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-5xl shadow-2xl border border-primary/20 ring-1 ring-primary/10"
            >
              🛡️
            </div>
            <div>
              <h1 class="text-3xl sm:text-5xl font-black text-base-content m-0 tracking-tighter">
                Angular Security
              </h1>
              <p class="text-lg text-base-content/50 m-0 mt-2 font-medium leading-relaxed">
                Interactive demonstrations of 5 security services for safe, production-grade
                applications.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2.5 justify-center sm:justify-start" aria-hidden="true">
            <span class="badge badge-primary font-black">Angular 21+</span>
            <span class="badge badge-secondary font-black">Signals</span>
            <span class="badge badge-accent font-black">OnPush</span>
          </div>
        </header>

        <nav
          class="flex flex-wrap gap-2.5 mb-12 p-2 bg-base-200/50 rounded-3xl border border-base-content/5 shadow-inner"
          role="tablist"
          aria-label="Demo sections"
        >
          @for (tab of tabs; track tab.id) {
            <button
              class="flex-1 min-w-[140px] py-4 px-6 rounded-2xl transition-all duration-300 font-black flex flex-col items-center gap-2 group border border-transparent"
              [class.bg-primary]="activeTab() === tab.id"
              [class.text-base-content]="activeTab() === tab.id"
              [class.shadow-2xl]="activeTab() === tab.id"
              [class.border-primary/20]="activeTab() === tab.id"
              [class.hover:bg-base-content/5]="activeTab() !== tab.id"
              [class.text-base-content/30]="activeTab() !== tab.id"
              (click)="setTab(tab.id)"
              [attr.aria-selected]="activeTab() === tab.id"
              [attr.aria-controls]="'panel-' + tab.id"
              [id]="'tab-' + tab.id"
              role="tab"
              type="button"
            >
              <span
                class="text-3xl transition-transform group-hover:scale-125 duration-300"
                aria-hidden="true"
                >{{ tab.icon }}</span
              >
              <span
                class="text-[10px] uppercase tracking-[0.2em] group-hover:text-base-content transition-colors"
                >{{ tab.label }}</span
              >
            </button>
          }
        </nav>
      }

      <div class="tab-content min-h-[600px]">
        @if (activeTab() === 'regex') {
          <div
            id="panel-regex"
            class="animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-regex"
          >
            <app-regex-security-demo />
          </div>
        }
        @if (activeTab() === 'crypto') {
          <div
            id="panel-crypto"
            class="animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-crypto"
          >
            <app-web-crypto-demo />
          </div>
        }
        @if (activeTab() === 'storage') {
          <div
            id="panel-storage"
            class="animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-storage"
          >
            <app-secure-storage-demo />
          </div>
        }
        @if (activeTab() === 'sanitizer') {
          <div
            id="panel-sanitizer"
            class="animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-sanitizer"
          >
            <app-input-sanitizer-demo />
          </div>
        }
        @if (activeTab() === 'password') {
          <div
            id="panel-password"
            class="animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-password"
          >
            <app-password-strength-demo />
          </div>
        }
      </div>
    </div>
  `,
})
export class SecurityComponent implements OnInit {
  readonly initialTab = input<SecurityDemoTab>('regex');
  readonly embedded = input<boolean>(false);

  activeTab = signal<SecurityDemoTab>('regex');

  readonly tabs: ReadonlyArray<{ id: SecurityDemoTab; icon: string; label: string }> = [
    { id: 'regex', icon: '🛡️', label: 'ReDoS Protection' },
    { id: 'crypto', icon: '🔐', label: 'WebCrypto' },
    { id: 'storage', icon: '🔒', label: 'Secure Storage' },
    { id: 'sanitizer', icon: '🧹', label: 'Input Sanitizer' },
    { id: 'password', icon: '🔑', label: 'Password Strength' },
  ];

  ngOnInit(): void {
    this.activeTab.set(this.initialTab());
  }

  setTab(tab: SecurityDemoTab): void {
    this.activeTab.set(tab);
  }
}
