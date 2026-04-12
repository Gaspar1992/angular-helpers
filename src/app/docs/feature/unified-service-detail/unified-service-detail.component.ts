import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  effect,
  untracked,
  Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../docs/shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../../docs/shared/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../../docs/shared/tabs/docs-tabs.component';
import {
  ServiceDoc,
  ApiRow,
  METHODS_COLUMNS,
  FN_FIELDS_COLUMNS,
} from '../../../docs/models/doc-meta.model';

export interface InterfaceDoc {
  name: string;
  description: string;
  properties: { name: string; type: string; description: string }[];
}

export interface ServiceDetailConfig {
  service: ServiceDoc;
  section: 'browser-web-apis' | 'security' | 'worker-http';
  backRoute: string;
  backLabel: string;
  hasDemoTab: boolean;
  demoComponent?: Type<unknown>;
  interfaces?: InterfaceDoc[];
}

@Component({
  selector: 'app-unified-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    DocsPageHeaderComponent,
    DocsApiTableComponent,
    CodeBlockComponent,
    DocsTabsComponent,
  ],
  template: `
    <div class="unified-service-detail">
      @if (service(); as s) {
        <app-docs-page-header [breadcrumbs]="breadcrumbs()" [title]="s.name" [lead]="s.description" />

        @if (s.fnVersion) {
          <div class="api-variant-toggle">
            <span class="toggle-label">API Variant:</span>
            <div class="toggle-buttons">
              <button
                type="button"
                class="toggle-btn"
                [class.toggle-btn--active]="apiVariant() === 'service'"
                (click)="apiVariant.set('service')"
              >
                Service
              </button>
              <button
                type="button"
                class="toggle-btn"
                [class.toggle-btn--active]="apiVariant() === 'fn'"
                (click)="apiVariant.set('fn')"
              >
                Function
              </button>
            </div>
          </div>
        }

        <app-docs-tabs
          [tabs]="currentTabs()"
          [activeTab]="activeTab()"
          (tabChange)="activeTab.set($event)"
        />

        @switch (activeTab()) {
          @case ('api') {
            <div class="usd-tab-content">
              <app-code-block language="ts" filename="example.ts" [code]="importExample()" />

              <h3 class="section-title">API Reference</h3>
              <app-docs-api-table [columns]="currentColumns()" [rows]="methodRows()" />

              @if (config().interfaces; as interfaces) {
                @for (iface of interfaces; track iface.name) {
                  <div class="iface-block">
                    <h4 class="iface-name">{{ iface.name }}</h4>
                    <p class="iface-desc">{{ iface.description }}</p>
                    <app-docs-api-table
                      [columns]="[
                        { key: 'name', header: 'Property', cellClass: '' },
                        { key: 'type', header: 'Type', cellClass: '' },
                        { key: 'description', header: 'Description', cellClass: '' },
                      ]"
                      [rows]="iface.properties"
                    />
                  </div>
                }
              }
            </div>
          }
          @case ('example') {
            <div class="usd-tab-content">
              <app-code-block language="ts" filename="usage.example.ts" [code]="s.example" />
            </div>
          }
          @case ('demo') {
            @if (config().demoComponent; as demo) {
              <div class="usd-tab-content demo-container">
                <ng-container *ngComponentOutlet="demo" />
              </div>
            }
          }
        }
      }
    </div>
  `,
  styles: [
    `
      .unified-service-detail {
        padding: var(--sp-6) 0;
      }

      .lead {
        font-size: var(--text-lg);
        color: var(--text-muted);
        margin: var(--sp-4) 0 var(--sp-6);
        line-height: 1.6;
      }

      .api-variant-toggle {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        margin-bottom: var(--sp-6);
        padding: var(--sp-3) var(--sp-4);
        background: var(--bg-elevated);
        border-radius: var(--radius-lg);
      }

      .toggle-label {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-muted);
      }

      .toggle-buttons {
        display: flex;
        gap: var(--sp-1);
      }

      .toggle-btn {
        padding: var(--sp-2) var(--sp-3);
        border: none;
        border-radius: var(--radius);
        background: transparent;
        color: var(--text-muted);
        font-size: var(--text-sm);
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition);
      }

      .toggle-btn:hover {
        background: var(--bg-hover);
        color: var(--text);
      }

      .toggle-btn--active {
        background: var(--accent);
        color: white;
      }

      .usd-tab-content {
        margin-top: var(--sp-6);
      }

      .section-title {
        font-size: var(--text-lg);
        font-weight: 700;
        margin: var(--sp-6) 0 var(--sp-4);
        color: var(--text);
      }

      .iface-block {
        margin-bottom: var(--sp-6);
      }

      .iface-name {
        font-size: var(--text-base);
        font-weight: 600;
        color: var(--text);
        margin: 0 0 var(--sp-2);
      }

      .iface-desc {
        font-size: var(--text-sm);
        color: var(--text-muted);
        margin: 0 0 var(--sp-3);
      }

      .demo-container {
        padding: var(--sp-4);
        background: var(--bg-elevated);
        border-radius: var(--radius-lg);
      }
    `,
  ],
})
export class UnifiedServiceDetailComponent {
  /** Config provided by router resolver via withComponentInputBinding */
  readonly config = input<ServiceDetailConfig | undefined>(undefined);

  protected readonly contentTabs: DocTab[] = [
    { id: 'api', label: 'API Reference' },
    { id: 'example', label: 'Example' },
  ];

  protected readonly contentTabsWithDemo: DocTab[] = [
    { id: 'api', label: 'API Reference' },
    { id: 'example', label: 'Example' },
    { id: 'demo', label: 'Demo' },
  ];

  /** First tab selected by default */
  protected activeTab = signal<string>('api');
  protected apiVariant = signal<'service' | 'fn'>('service');

  protected service = computed(() => this.config()?.service);

  protected currentTabs = computed(() => {
    const cfg = this.config();
    return cfg?.hasDemoTab && cfg?.demoComponent ? this.contentTabsWithDemo : this.contentTabs;
  });

  protected breadcrumbs = computed(() => {
    const cfg = this.config();
    const s = this.service();
    if (!cfg) return [{ label: 'docs', routerLink: '/docs' }];
    return [
      { label: 'docs', routerLink: '/docs' },
      { label: cfg.section, routerLink: cfg.backRoute },
      { label: s?.name ?? '' },
    ];
  });

  protected importExample = computed(() => {
    const s = this.service();
    if (!s) return '';
    if (this.apiVariant() === 'fn' && s.fnVersion) {
      return `import { ${s.fnVersion.name} } from '${s.fnVersion.importPath}'`;
    }
    return `import { ${s.name} } from '${s.importPath}'`;
  });

  protected currentColumns = computed(() => {
    const s = this.service();
    if (s?.fnVersion && this.apiVariant() === 'fn') return FN_FIELDS_COLUMNS;
    return METHODS_COLUMNS;
  });

  protected methodRows = computed<ApiRow[]>(() => {
    const s = this.service();
    if (!s) return [];
    if (this.apiVariant() === 'fn' && s.fnVersion) {
      return s.fnVersion.fields as unknown as ApiRow[];
    }
    return s.methods as unknown as ApiRow[];
  });

  constructor() {
    effect(() => {
      this.config();
      untracked(() => {
        this.apiVariant.set('service');
        this.activeTab.set('api');
      });
    });
  }
}
