import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../../data/security.data';
import { ServiceDoc } from '../../models/doc-meta.model';

@Component({
  selector: 'app-security-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlockComponent],
  template: `
    @if (service()) {
      <div class="docs-page">
        <div class="docs-page-header">
          <nav class="docs-breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/docs">Docs</a>
            <span aria-hidden="true">›</span>
            <a routerLink="/docs/security">security</a>
            <span aria-hidden="true">›</span>
            <span>{{ service()!.name }}</span>
          </nav>
          <h1 class="docs-page-title svc-mono-title">{{ service()!.name }}</h1>
          <code class="docs-badge docs-badge--import">
            import &#123; {{ service()!.name }} &#125; from '{{ service()!.importPath }}'
          </code>
          <p class="docs-page-lead">{{ service()!.description }}</p>
          <div class="docs-meta-chips">
            <span class="docs-chip docs-chip--scope">providedIn: {{ service()!.scope }}</span>
          </div>
        </div>

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

        @if (interfaces().length) {
          <section class="docs-section">
            <h2 class="docs-section-title">Related interfaces</h2>
            @for (iface of interfaces(); track iface.name) {
              <div class="iface-block">
                <h3 class="iface-name">{{ iface.name }}</h3>
                <p class="iface-desc">{{ iface.description }}</p>
                <div class="docs-table-wrapper" role="region" [attr.aria-label]="iface.name + ' fields'">
                  <table class="docs-table">
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
                          <td><code class="docs-code-name">{{ field.name }}</code></td>
                          <td><code class="docs-code-ret">{{ field.type }}</code></td>
                          <td class="docs-cell-desc">{{ field.description }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </section>
        }

        <section class="docs-section">
          <h2 class="docs-section-title">Example</h2>
          <app-code-block [code]="service()!.example" />
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1 class="docs-page-title">Service not found</h1>
        <p class="docs-page-lead" style="max-width:none">
          The requested service does not exist in this package.
        </p>
        <a routerLink="/docs/security">← Back to security</a>
      </div>
    }
  `,
  styles: [`
    .svc-mono-title { font-family: var(--font-mono); }

    .iface-block { margin-bottom: var(--sp-8); }

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

    .not-found { padding-top: var(--sp-8); }

    .not-found a {
      color: var(--accent);
      text-decoration: none;
      font-size: 0.9rem;
    }

    .not-found a:hover { text-decoration: underline; }
  `],
})
export class SecurityServiceDetailComponent {
  private route = inject(ActivatedRoute);

  private serviceId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('service') ?? '')),
    { initialValue: '' },
  );

  protected service = computed<ServiceDoc | undefined>(() =>
    SECURITY_SERVICES.find((s) => s.id === this.serviceId()),
  );

  protected interfaces = computed(() => {
    const id = this.serviceId();
    if (id === 'regex-security') return SECURITY_INTERFACES;
    return [];
  });
}
