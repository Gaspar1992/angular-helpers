import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { BROWSER_WEB_APIS_SERVICES } from '../../data/browser-web-apis.data';
import { ServiceDoc } from '../../models/doc-meta.model';

@Component({
  selector: 'app-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlockComponent],
  template: `
    @if (service()) {
      <div class="service-detail">
        <div class="page-header">
          <div class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/docs">Docs</a>
            <span aria-hidden="true">›</span>
            <a routerLink="/docs/browser-web-apis">browser-web-apis</a>
            <span aria-hidden="true">›</span>
            <span>{{ service()!.name }}</span>
          </div>
          <h1>{{ service()!.name }}</h1>
          <code class="import-badge">import &#123; {{ service()!.name }} &#125; from '{{ service()!.importPath }}'</code>
          <p class="page-lead">{{ service()!.description }}</p>

          <div class="meta-chips">
            <span class="chip chip-scope">providedIn: {{ service()!.scope }}</span>
            @if (service()!.requiresSecureContext) {
              <span class="chip chip-secure">🔒 Requires HTTPS</span>
            }
          </div>
        </div>

        <section class="section">
          <h2>Browser support</h2>
          <p class="support-text">{{ service()!.browserSupport }}</p>
        </section>

        @if (service()!.notes.length) {
          <section class="section">
            <h2>Notes</h2>
            <ul class="notes-list">
              @for (note of service()!.notes; track note) {
                <li>{{ note }}</li>
              }
            </ul>
          </section>
        }

        <section class="section">
          <h2>API reference</h2>
          <div class="methods-table" role="region" aria-label="API methods">
            <table>
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">Signature</th>
                  <th scope="col">Returns</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                @for (method of service()!.methods; track method.name) {
                  <tr>
                    <td><code class="method-name">{{ method.name }}</code></td>
                    <td><code class="method-sig">{{ method.signature }}</code></td>
                    <td><code class="method-ret">{{ method.returns }}</code></td>
                    <td class="method-desc">{{ method.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <h2>Example</h2>
          <app-code-block [code]="service()!.example" />
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1>Service not found</h1>
        <p>The requested service does not exist in this package.</p>
        <a routerLink="/docs/browser-web-apis">← Back to browser-web-apis</a>
      </div>
    }
  `,
  styles: [
    `
      .service-detail,
      .not-found {
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
        flex-wrap: wrap;
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
        margin: 0 0 0.6rem;
        letter-spacing: -0.03em;
        font-family: 'Fira Code', 'Cascadia Code', monospace;
      }

      .import-badge {
        display: inline-block;
        font-size: 0.8rem;
        color: #a0f0b0;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 0.3rem 0.7rem;
        border-radius: 5px;
        margin-bottom: 1rem;
        font-family: 'Fira Code', monospace;
      }

      .page-lead {
        color: #909ab8;
        font-size: 1rem;
        line-height: 1.7;
        max-width: 650px;
        margin: 0.75rem 0 1rem;
      }

      .meta-chips {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .chip {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
      }

      .chip-scope {
        background: rgba(107, 140, 242, 0.12);
        color: #6b8cf2;
        border: 1px solid rgba(107, 140, 242, 0.2);
      }

      .chip-secure {
        background: rgba(255, 200, 80, 0.1);
        color: #f0c060;
        border: 1px solid rgba(255, 200, 80, 0.2);
      }

      .section {
        margin-bottom: 2.5rem;
      }

      h2 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      .support-text {
        color: #b0b8d0;
        font-size: 0.9rem;
        margin: 0;
      }

      .notes-list {
        padding-left: 1.5rem;
        margin: 0;
        color: #909ab8;
        font-size: 0.9rem;
        line-height: 1.8;
      }

      /* Methods table */
      .methods-table {
        overflow-x: auto;
        border-radius: 8px;
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
        padding: 0.75rem 1rem;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #7a84a0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        white-space: nowrap;
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        vertical-align: top;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: rgba(255, 255, 255, 0.02);
      }

      .method-name {
        color: #6b8cf2;
        font-family: 'Fira Code', monospace;
        font-size: 0.85rem;
        white-space: nowrap;
      }

      .method-sig {
        color: #a0a8c0;
        font-family: 'Fira Code', monospace;
        font-size: 0.8rem;
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

      /* Not found */
      .not-found h1 {
        font-family: inherit;
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
      }

      .not-found p {
        color: #909ab8;
        margin-bottom: 1rem;
      }

      .not-found a {
        color: #6b8cf2;
        text-decoration: none;
      }

      .not-found a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class ServiceDetailComponent {
  private route = inject(ActivatedRoute);

  private serviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('service') ?? '')),
    { initialValue: '' },
  );

  protected service = computed<ServiceDoc | undefined>(() =>
    BROWSER_WEB_APIS_SERVICES.find((s) => s.id === this.serviceId()),
  );
}
