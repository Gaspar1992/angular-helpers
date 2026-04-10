import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
  untracked,
  Type,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { CodeBlockComponent } from '../../../ui/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../ui/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../../ui/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../../ui/tabs/docs-tabs.component';
import {
  ServiceDoc,
  ApiRow,
  METHODS_COLUMNS,
  FN_FIELDS_COLUMNS,
} from '../../../docs/models/doc-meta.model';

export interface ServiceDetailConfig {
  /** Service data */
  service: ServiceDoc;
  /** Section identifier for navigation */
  section: 'browser-web-apis' | 'security' | 'worker-http';
  /** Back navigation */
  backRoute: string;
  backLabel: string;
  /** Whether to show demo tab */
  hasDemoTab: boolean;
  /** Demo component if available */
  demoComponent?: Type<unknown>;
  /** Additional interfaces to display */
  interfaces?: InterfaceDoc[];
}

export interface InterfaceDoc {
  name: string;
  description: string;
  fields: ApiRow[];
}

const CONTENT_TABS_API_EXAMPLE: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
];

const CONTENT_TABS_WITH_DEMO: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
  { id: 'demo', label: 'Demo' },
];

@Component({
  selector: 'app-unified-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgComponentOutlet,
    DocsPageHeaderComponent,
    DocsApiTableComponent,
    CodeBlockComponent,
    DocsTabsComponent,
  ],
  template: `
    @if (config().service) {
      <div class="docs-page">
        <app-docs-page-header
          [breadcrumbs]="breadcrumbs()"
          [title]="config().service.name"
          [titleMono]="true"
          [badge]="badge()"
          badgeVariant="import"
          [lead]="config().service.description"
          [scope]="config().service.scope"
          [requiresSecureContext]="config().service.requiresSecureContext"
        />

        @if (config().service.browserSupport) {
          <section class="docs-section">
            <h2 class="docs-section-title">Browser support</h2>
            <p class="docs-support-text">{{ config().service.browserSupport }}</p>
          </section>
        }

        @if (config().service.notes?.length) {
          <section class="docs-section">
            <h2 class="docs-section-title">Notes</h2>
            <ul class="docs-note-list">
              @for (note of config().service.notes; track $index) {
                <li>{{ note }}</li>
              }
            </ul>
          </section>
        }

        @if (config().service.fnVersion) {
          <div class="api-variant-group" role="group" aria-label="API variant">
            <button
              class="api-variant-btn"
              [class.api-variant-btn--active]="apiVariant() === 'service'"
              (click)="apiVariant.set('service')"
            >
              Service
            </button>
            <button
              class="api-variant-btn"
              [class.api-variant-btn--active]="apiVariant() === 'fn'"
              (click)="apiVariant.set('fn')"
            >
              &#9889; Signal Fn
            </button>
          </div>
        }

        @if (apiVariant() === 'fn' && config().service.fnVersion) {
          <section class="docs-section fn-description">
            <p class="docs-page-lead">{{ config().service.fnVersion.description }}</p>
            <code class="fn-return-type">
              Returns: <strong>{{ config().service.fnVersion.returnType }}</strong>
            </code>
          </section>
        }

        <section class="docs-section">
          <app-docs-tabs
            [tabs]="contentTabs()"
            [activeTab]="activeTab()"
            ariaLabel="Service documentation"
            (tabChange)="activeTab.set($event)"
          />
          <div
            role="tabpanel"
            [id]="'panel-' + activeTab()"
            [attr.aria-labelledby]="'tab-' + activeTab()"
          >
            @if (activeTab() === 'api') {
              <app-docs-api-table
                [columns]="currentColumns()"
                [rows]="methodRows()"
                [ariaLabel]="apiVariant() === 'fn' ? 'Signal Fn fields' : 'API methods'"
              />
              @if (config().interfaces?.length) {
                <div class="iface-section">
                  <h3 class="iface-section-title">Related interfaces</h3>
                  @for (iface of config().interfaces!; track iface.name) {
                    <div class="iface-block">
                      <h4 class="iface-name">{{ iface.name }}</h4>
                      <p class="iface-desc">{{ iface.description }}</p>
                      <app-docs-api-table
                        [columns]="FN_FIELDS_COLUMNS"
                        [rows]="iface.fields"
                        [ariaLabel]="iface.name + ' fields'"
                      />
                    </div>
                  }
                </div>
              }
            }
            @if (activeTab() === 'example') {
              <app-code-block [code]="currentExample()" />
            }
            @if (activeTab() === 'demo' && config().hasDemoTab) {
              @if (config().demoComponent) {
                <ng-container *ngComponentOutlet="config().demoComponent!" />
              } @else {
                <p class="docs-support-text">No interactive demo available for this service yet.</p>
              }
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1 class="docs-page-title">Service not found</h1>
        <p class="docs-page-lead" style="max-width: none">
          The requested service does not exist in this package.
        </p>
        <a [routerLink]="config().backRoute">← Back to {{ config().backLabel }}</a>
      </div>
    }
  `,
  styles: [
    `
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
      .api-variant-group {
        display: inline-flex;
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: var(--sp-4, 1rem);
      }
      .api-variant-btn {
        padding: 6px 18px;
        font-size: 0.85rem;
        font-weight: 500;
        background: transparent;
        border: none;
        border-right: 1px solid var(--border, #e2e8f0);
        color: var(--text-muted, #64748b);
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s;
        line-height: 1.5;
      }
      .api-variant-btn:last-child {
        border-right: none;
      }
      .api-variant-btn--active {
        background: var(--accent, #6366f1);
        color: #fff;
      }
      .api-variant-btn:not(.api-variant-btn--active):hover {
        background: var(--surface-hover, #f1f5f9);
        color: var(--text, #1e293b);
      }
      .fn-description {
        padding-top: 0;
      }
      .fn-return-type {
        display: inline-block;
        font-size: 0.85rem;
        color: var(--text-muted, #64748b);
        margin-top: 6px;
      }
      .fn-return-type strong {
        color: var(--accent, #6366f1);
        font-family: var(--font-mono, monospace);
      }
      .iface-section {
        margin-top: var(--sp-6);
      }
      .iface-section-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin: 0 0 var(--sp-4);
      }
      .iface-block {
        margin-bottom: var(--sp-8);
      }
      h4.iface-name {
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
    `,
  ],
})
export class UnifiedServiceDetailComponent {
  /** Resolved config from router */
  readonly config = input.required<ServiceDetailConfig>();

  /** Expose constants for template */
  protected readonly FN_FIELDS_COLUMNS = FN_FIELDS_COLUMNS;

  protected readonly activeTab = signal<string>('api');
  protected readonly apiVariant = signal<'service' | 'fn'>('service');

  constructor() {
    effect(() => {
      // Reset tabs when config changes (route navigation)
      this.config();
      untracked(() => {
        this.activeTab.set('api');
        this.apiVariant.set('service');
      });
    });
  }

  /** Content tabs based on config */
  protected contentTabs = (): DocTab[] =>
    this.config().hasDemoTab ? CONTENT_TABS_WITH_DEMO : CONTENT_TABS_API_EXAMPLE;

  /** Breadcrumbs */
  protected breadcrumbs = () => [
    { label: 'Docs', route: '/docs' },
    { label: this.config().backLabel, route: this.config().backRoute },
    { label: this.config().service?.name ?? '' },
  ];

  /** Import badge */
  protected badge = (): string => {
    const svc = this.config().service;
    if (!svc) return '';
    if (this.apiVariant() === 'fn' && svc.fnVersion) {
      return `import { ${svc.fnVersion.name} } from '${svc.fnVersion.importPath}'`;
    }
    return `import { ${svc.name} } from '${svc.importPath}'`;
  };

  /** Current columns based on api variant */
  protected currentColumns = () => {
    const svc = this.config().service;
    if (svc?.fnVersion && this.apiVariant() === 'fn') return FN_FIELDS_COLUMNS;
    return METHODS_COLUMNS;
  };

  /** Method/field rows for table */
  protected methodRows = (): ApiRow[] => {
    const svc = this.config().service;
    if (!svc) return [];
    if (this.apiVariant() === 'fn' && svc.fnVersion) {
      return svc.fnVersion.fields as unknown as ApiRow[];
    }
    return svc.methods as unknown as ApiRow[];
  };

  /** Current example code */
  protected currentExample = (): string => {
    const svc = this.config().service;
    if (!svc) return '';
    if (this.apiVariant() === 'fn' && svc.fnVersion) {
      return svc.fnVersion.example;
    }
    return svc.example;
  };
}
