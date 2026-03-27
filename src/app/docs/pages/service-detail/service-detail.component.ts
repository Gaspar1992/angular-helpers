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
      <div class="docs-page service-detail">
        <div class="docs-page-header">
          <nav class="docs-breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/docs">Docs</a>
            <span aria-hidden="true">›</span>
            <a routerLink="/docs/browser-web-apis">browser-web-apis</a>
            <span aria-hidden="true">›</span>
            <span>{{ service()!.name }}</span>
          </nav>
          <h1 class="docs-page-title service-mono-title">{{ service()!.name }}</h1>
          <code class="docs-badge docs-badge--import">import &#123; {{ service()!.name }} &#125; from '{{ service()!.importPath }}'</code>
          <p class="docs-page-lead">{{ service()!.description }}</p>
          <div class="docs-meta-chips">
            <span class="docs-chip docs-chip--scope">providedIn: {{ service()!.scope }}</span>
            @if (service()!.requiresSecureContext) {
              <span class="docs-chip docs-chip--secure">🔒 Requires HTTPS</span>
            }
          </div>
        </div>

        <section class="docs-section">
          <h2 class="docs-section-title">Browser support</h2>
          <p class="docs-support-text">{{ service()!.browserSupport }}</p>
        </section>

        @if (service()!.notes.length) {
          <section class="docs-section">
            <h2 class="docs-section-title">Notes</h2>
            <ul class="docs-note-list">
              @for (note of service()!.notes; track note) {
                <li>{{ note }}</li>
              }
            </ul>
          </section>
        }

        <section class="docs-section">
          <h2 class="docs-section-title">API reference</h2>
          <div class="docs-table-wrapper" role="region" aria-label="API methods">
            <table class="docs-table">
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
                    <td><code class="docs-code-name">{{ method.name }}</code></td>
                    <td><code class="docs-code-sig">{{ method.signature }}</code></td>
                    <td><code class="docs-code-ret">{{ method.returns }}</code></td>
                    <td class="docs-cell-desc">{{ method.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="docs-section">
          <h2 class="docs-section-title">Example</h2>
          <app-code-block [code]="service()!.example" />
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1 class="docs-page-title">Service not found</h1>
        <p class="docs-page-lead" style="max-width:none">The requested service does not exist in this package.</p>
        <a routerLink="/docs/browser-web-apis">← Back to browser-web-apis</a>
      </div>
    }
  `,
  styles: [
    `
      .service-mono-title {
        font-family: var(--font-mono);
      }

      .not-found {
        padding-top: var(--sp-8);
      }

      .not-found a {
        color: var(--accent);
        text-decoration: none;
        font-size: 0.9rem;
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
