import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../shared/api-table/docs-api-table.component';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../../data/security.data';
import {
  BreadcrumbItem,
  ApiRow,
  METHODS_COLUMNS_SHORT,
  FIELDS_COLUMNS,
} from '../../models/doc-meta.model';

const PROVIDER_EXAMPLE = `import { provideSecurity } from '@angular-helpers/security';

bootstrapApplication(AppComponent, {
  providers: [
    provideSecurity({
      enableRegexSecurity: true,
      defaultTimeout: 5000,
      safeMode: false,
    }),
  ],
});`;

@Component({
  selector: 'app-security-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent, DocsPageHeaderComponent, DocsApiTableComponent],
  template: `
    <div class="docs-page">
      <app-docs-page-header
        [breadcrumbs]="breadcrumbs"
        title="security"
        badge="@angular-helpers/security"
        badgeVariant="npm"
        lead="Prevents ReDoS attacks by executing regular expressions in isolated Web Workers with configurable timeouts and complexity analysis."
      />

      <section class="docs-section">
        <h2 class="docs-section-title">Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/security'" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Setup</h2>
        <app-code-block [code]="providerExample" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Services &amp; Exports</h2>
        <div class="services-grid">
          @for (svc of services; track svc.id) {
            <div class="svc-card">
              <h3 class="svc-name">{{ svc.name }}</h3>
              <p class="svc-desc">{{ svc.description }}</p>
              <app-docs-api-table
                [columns]="methodsShortColumns"
                [rows]="toRows(svc.methods)"
                [ariaLabel]="svc.name + ' methods'"
              />
              <div class="example-label">Example</div>
              <app-code-block [code]="svc.example" />
            </div>
          }
        </div>
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Interfaces</h2>
        @for (iface of interfaces; track $index) {
          <div class="iface-block">
            <h3 class="iface-name">{{ iface.name }}</h3>
            <p class="iface-desc">{{ iface.description }}</p>
            <app-docs-api-table
              [columns]="fieldsColumns"
              [rows]="iface.fields"
              [ariaLabel]="iface.name + ' fields'"
            />
          </div>
        }
      </section>

      <section class="docs-section risk-section">
        <h2 class="docs-section-title">Risk levels</h2>
        <div class="risk-grid">
          <div class="risk-card low">
            <span class="risk-dot"></span>
            <div>
              <strong>Low</strong>
              <p>Simple, safe patterns with no backtracking risks.</p>
            </div>
          </div>
          <div class="risk-card medium">
            <span class="risk-dot"></span>
            <div>
              <strong>Medium</strong>
              <p>Patterns with lookahead / lookbehind assertions.</p>
            </div>
          </div>
          <div class="risk-card high">
            <span class="risk-dot"></span>
            <div>
              <strong>High</strong>
              <p>Complex quantifiers that may cause slow matching.</p>
            </div>
          </div>
          <div class="risk-card critical">
            <span class="risk-dot"></span>
            <div>
              <strong>Critical</strong>
              <p>Catastrophic backtracking — blocked in safe mode.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .services-grid {
        display: flex;
        flex-direction: column;
        gap: var(--sp-8);
      }

      .svc-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: var(--sp-4);
      }

      @media (min-width: 640px) {
        .svc-card { padding: var(--sp-6); }
      }

      h3.svc-name {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-white);
        margin: 0 0 var(--sp-2);
        font-family: var(--font-mono);
      }

      .svc-desc {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.65;
        margin: 0 0 var(--sp-5);
      }

      .example-label {
        font-size: var(--text-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--text-muted);
        margin: var(--sp-5) 0 var(--sp-2);
      }

      .iface-block {
        margin-bottom: var(--sp-8);
      }

      h3.iface-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #c0c8e0;
        margin: 0 0 var(--sp-2);
        font-family: var(--font-mono);
      }

      .iface-desc {
        color: var(--text-muted);
        font-size: var(--text-base);
        margin: 0 0 var(--sp-3);
      }

      /* Risk grid */
      .risk-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-3);
      }

      @media (min-width: 480px) {
        .risk-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: var(--sp-4);
        }
      }

      @media (min-width: 768px) {
        .risk-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
      }

      .risk-card {
        display: flex;
        align-items: flex-start;
        gap: var(--sp-3);
        padding: var(--sp-4);
        border-radius: var(--radius-lg);
        border: 1px solid;
      }

      .risk-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 0.35rem;
      }

      .risk-card strong {
        display: block;
        font-size: 0.9rem;
        margin-bottom: var(--sp-1);
      }

      .risk-card p {
        font-size: var(--text-sm);
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .risk-card.low   { background: rgba(80,200,120,.06); border-color: rgba(80,200,120,.2); }
      .risk-card.low   .risk-dot { background: #50c878; }
      .risk-card.low   strong    { color: #50c878; }

      .risk-card.medium { background: rgba(255,200,0,.06); border-color: rgba(255,200,0,.2); }
      .risk-card.medium .risk-dot { background: #ffc800; }
      .risk-card.medium strong    { color: #ffc800; }

      .risk-card.high  { background: rgba(255,140,0,.06); border-color: rgba(255,140,0,.2); }
      .risk-card.high  .risk-dot { background: #ff8c00; }
      .risk-card.high  strong    { color: #ff8c00; }

      .risk-card.critical { background: rgba(255,60,60,.06); border-color: rgba(255,60,60,.2); }
      .risk-card.critical .risk-dot { background: #ff3c3c; }
      .risk-card.critical strong    { color: #ff3c3c; }
    `,
  ],
})
export class SecurityOverviewComponent {
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Docs', route: '/docs' },
    { label: 'security' },
  ];
  protected readonly methodsShortColumns = METHODS_COLUMNS_SHORT;
  protected readonly fieldsColumns = FIELDS_COLUMNS;
  protected readonly services = SECURITY_SERVICES;
  protected readonly interfaces = SECURITY_INTERFACES;
  protected readonly providerExample = PROVIDER_EXAMPLE;

  protected toRows(methods: { name: string; signature: string; returns: string; description: string }[]): ApiRow[] {
    return (methods as unknown) as ApiRow[];
  }
}
