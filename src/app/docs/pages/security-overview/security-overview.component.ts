import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../../data/security.data';

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
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <div class="security-docs">
      <div class="page-header">
        <div class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/docs">Docs</a>
          <span aria-hidden="true">›</span>
          <span>security</span>
        </div>
        <h1>security</h1>
        <code class="npm-badge">&#64;angular-helpers/security</code>
        <p class="page-lead">
          Prevents ReDoS (Regular Expression Denial of Service) attacks by executing regular
          expressions in isolated Web Workers with configurable timeouts and complexity analysis.
        </p>
      </div>

      <section class="section">
        <h2>Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/security'" />
      </section>

      <section class="section">
        <h2>Setup</h2>
        <app-code-block [code]="providerExample" />
      </section>

      <section class="section">
        <h2>Services &amp; Exports</h2>
        <div class="services-grid">
          @for (svc of services; track svc.id) {
            <div class="svc-card">
              <h3 class="svc-name">{{ svc.name }}</h3>
              <p class="svc-desc">{{ svc.description }}</p>

              <div class="methods-table" role="region" [attr.aria-label]="svc.name + ' methods'">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Method</th>
                      <th scope="col">Returns</th>
                      <th scope="col">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (method of svc.methods; track method.name) {
                      <tr>
                        <td><code class="method-name">{{ method.name }}</code></td>
                        <td><code class="method-ret">{{ method.returns }}</code></td>
                        <td class="method-desc">{{ method.description }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="example-label">Example</div>
              <app-code-block [code]="svc.example" />
            </div>
          }
        </div>
      </section>

      <section class="section">
        <h2>Interfaces</h2>
        @for (iface of interfaces; track iface.name) {
          <div class="iface-block">
            <h3 class="iface-name">{{ iface.name }}</h3>
            <p class="iface-desc">{{ iface.description }}</p>
            <div class="methods-table" role="region" [attr.aria-label]="iface.name + ' fields'">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Type</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  @for (field of iface.fields; track field.name) {
                    <tr>
                      <td><code class="method-name">{{ field.name }}</code></td>
                      <td><code class="method-ret">{{ field.type }}</code></td>
                      <td class="method-desc">{{ field.description }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </section>

      <section class="section risk-section">
        <h2>Risk levels</h2>
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
      .security-docs {
        padding-bottom: 3rem;
      }

      .page-header {
        margin-bottom: 2.5rem;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        color: #7a84a0;
        margin-bottom: 1rem;
      }

      .breadcrumb a {
        color: #6b8cf2;
        text-decoration: none;
      }

      .breadcrumb a:hover {
        text-decoration: underline;
      }

      h1 {
        font-size: 1.9rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.5rem;
        letter-spacing: -0.03em;
      }

      .npm-badge {
        display: inline-block;
        font-size: 0.82rem;
        color: #6b8cf2;
        background: rgba(107, 140, 242, 0.12);
        padding: 0.2rem 0.55rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-family: 'Fira Code', monospace;
      }

      .page-lead {
        color: #909ab8;
        font-size: 1rem;
        line-height: 1.7;
        max-width: 650px;
        margin: 0.75rem 0 0;
      }

      .section {
        margin-bottom: 3rem;
      }

      h2 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 1.25rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      .services-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .svc-card {
        background: #1a1c28;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 1.5rem;
      }

      h3.svc-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 0.5rem;
        font-family: 'Fira Code', monospace;
      }

      .svc-desc {
        color: #909ab8;
        font-size: 0.9rem;
        line-height: 1.65;
        margin: 0 0 1.25rem;
      }

      .example-label {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: #7a84a0;
        margin: 1.25rem 0 0.4rem;
      }

      /* Interfaces */
      .iface-block {
        margin-bottom: 2rem;
      }

      h3.iface-name {
        font-size: 1rem;
        font-weight: 700;
        color: #c0c8e0;
        margin: 0 0 0.4rem;
        font-family: 'Fira Code', monospace;
      }

      .iface-desc {
        color: #7a84a0;
        font-size: 0.87rem;
        margin: 0 0 0.75rem;
      }

      /* Tables */
      .methods-table {
        overflow-x: auto;
        border-radius: 7px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      thead {
        background: rgba(255, 255, 255, 0.04);
      }

      th {
        text-align: left;
        padding: 0.65rem 1rem;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #7a84a0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        white-space: nowrap;
      }

      td {
        padding: 0.7rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        vertical-align: top;
      }

      tr:last-child td {
        border-bottom: none;
      }

      .method-name {
        color: #6b8cf2;
        font-family: 'Fira Code', monospace;
        font-size: 0.85rem;
        white-space: nowrap;
      }

      .method-ret {
        color: #a0f0b0;
        font-family: 'Fira Code', monospace;
        font-size: 0.8rem;
        white-space: nowrap;
      }

      .method-desc {
        color: #909ab8;
        min-width: 180px;
      }

      /* Risk grid */
      .risk-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .risk-card {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 8px;
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
        margin-bottom: 0.3rem;
      }

      .risk-card p {
        font-size: 0.82rem;
        margin: 0;
        color: #909ab8;
      }

      .risk-card.low {
        background: rgba(80, 200, 120, 0.06);
        border-color: rgba(80, 200, 120, 0.2);
      }
      .risk-card.low .risk-dot {
        background: #50c878;
      }
      .risk-card.low strong {
        color: #50c878;
      }

      .risk-card.medium {
        background: rgba(255, 200, 0, 0.06);
        border-color: rgba(255, 200, 0, 0.2);
      }
      .risk-card.medium .risk-dot {
        background: #ffc800;
      }
      .risk-card.medium strong {
        color: #ffc800;
      }

      .risk-card.high {
        background: rgba(255, 140, 0, 0.06);
        border-color: rgba(255, 140, 0, 0.2);
      }
      .risk-card.high .risk-dot {
        background: #ff8c00;
      }
      .risk-card.high strong {
        color: #ff8c00;
      }

      .risk-card.critical {
        background: rgba(255, 60, 60, 0.06);
        border-color: rgba(255, 60, 60, 0.2);
      }
      .risk-card.critical .risk-dot {
        background: #ff3c3c;
      }
      .risk-card.critical strong {
        color: #ff3c3c;
      }
    `,
  ],
})
export class SecurityOverviewComponent {
  protected readonly services = SECURITY_SERVICES;
  protected readonly interfaces = SECURITY_INTERFACES;
  protected readonly providerExample = PROVIDER_EXAMPLE;
}
