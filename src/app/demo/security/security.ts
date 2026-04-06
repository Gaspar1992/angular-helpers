import { ChangeDetectionStrategy, Component, OnInit, input, signal } from '@angular/core';
import { RegexSecurityDemoComponent } from '../services/regex-security/regex-security-demo.component';
import { WebCryptoDemoComponent } from '../services/web-crypto/web-crypto-demo.component';
import { SecureStorageDemoComponent } from '../services/secure-storage/secure-storage-demo.component';
import { InputSanitizerDemoComponent } from '../services/input-sanitizer/input-sanitizer-demo.component';
import { PasswordStrengthDemoComponent } from '../services/password-strength/password-strength-demo.component';

export type SecurityDemoTab = 'regex' | 'crypto' | 'storage' | 'sanitizer' | 'password';

@Component({
  selector: 'app-security',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RegexSecurityDemoComponent,
    WebCryptoDemoComponent,
    SecureStorageDemoComponent,
    InputSanitizerDemoComponent,
    PasswordStrengthDemoComponent,
  ],
  templateUrl: './security.html',
  styleUrl: './security.css',
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
