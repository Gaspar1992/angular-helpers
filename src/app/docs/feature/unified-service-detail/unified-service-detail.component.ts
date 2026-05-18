import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../docs/shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../../docs/shared/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../../docs/shared/tabs/docs-tabs.component';
import {
  ServiceDoc,
  ApiRow,
  METHODS_COLUMNS,
  FN_FIELDS_COLUMNS,
  INPUTS_COLUMNS,
  OUTPUTS_COLUMNS,
} from '../../../docs/models/doc-meta.model';

export interface InterfaceDoc {
  name: string;
  description: string;
  properties: { name: string; type: string; description: string }[];
}

export interface ServiceDetailConfig {
  service: ServiceDoc;
  section: 'browser-web-apis' | 'security' | 'worker-http' | 'openlayers' | 'storage';
  backRoute: string;
  backLabel: string;
  interfaces?: InterfaceDoc[];
}

@Component({
  selector: 'app-unified-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsApiTableComponent, CodeBlockComponent, DocsTabsComponent],
  template: `
    <div class="max-width-container py-12 sm:py-16 max-w-[900px]">
      @if (service(); as s) {
        <app-docs-page-header [title]="s.name" [lead]="s.description" />

        @if (s.fnVersion) {
          <div
            class="flex items-center gap-4 p-5 mb-10 bg-base-200 border border-border-subtle rounded-3xl shadow-sm"
          >
            <span class="text-xs font-black uppercase tracking-widest text-base-content/30 ml-2"
              >API Variant</span
            >
            <div
              class="flex gap-1.5 p-1 bg-base-content/5 rounded-2xl border border-border-subtle shadow-inner"
            >
              <button
                type="button"
                class="px-5 py-2 text-sm font-bold rounded-xl transition-all"
                [class.bg-primary]="apiVariant() === 'service'"
                [class.text-primary-content]="apiVariant() === 'service'"
                [class.shadow-lg]="apiVariant() === 'service'"
                [class.text-base-content/40]="apiVariant() !== 'service'"
                [class.hover:text-base-content/70]="apiVariant() !== 'service'"
                (click)="apiVariant.set('service')"
              >
                Service
              </button>
              <button
                type="button"
                class="px-5 py-2 text-sm font-bold rounded-xl transition-all"
                [class.bg-primary]="apiVariant() === 'fn'"
                [class.text-primary-content]="apiVariant() === 'fn'"
                [class.shadow-lg]="apiVariant() === 'fn'"
                [class.text-base-content/40]="apiVariant() !== 'fn'"
                [class.hover:text-base-content/70]="apiVariant() !== 'fn'"
                (click)="apiVariant.set('fn')"
              >
                Function
              </button>
            </div>
          </div>
        }

        <app-docs-tabs
          [tabs]="contentTabs"
          [activeTab]="activeTab()"
          (tabChange)="activeTab.set($event)"
        />

        @switch (activeTab()) {
          @case ('api') {
            <div class="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <app-code-block language="ts" filename="example.ts" [code]="importExample()" />

              @if (hasInputs()) {
                <h3
                  class="text-xl font-black text-base-content mt-16 mb-6 tracking-tight flex items-center gap-2"
                >
                  <span class="text-primary/60">#</span> Inputs
                </h3>
                <app-docs-api-table [columns]="INPUTS_COLUMNS" [rows]="inputRows()" />
              }

              @if (hasOutputs()) {
                <h3
                  class="text-xl font-black text-base-content mt-16 mb-6 tracking-tight flex items-center gap-2"
                >
                  <span class="text-primary/60">#</span> Outputs
                </h3>
                <app-docs-api-table [columns]="OUTPUTS_COLUMNS" [rows]="outputRows()" />
              }

              @if (hasMethods()) {
                <h3
                  class="text-xl font-black text-base-content mt-16 mb-6 tracking-tight flex items-center gap-2"
                >
                  <span class="text-primary/60">#</span>
                  {{ apiVariant() === 'fn' ? 'Properties' : 'Methods' }}
                </h3>
                <app-docs-api-table [columns]="currentColumns()" [rows]="methodRows()" />
              }

              @if (config()?.interfaces; as interfaces) {
                @for (iface of interfaces; track iface.name) {
                  <div class="mt-20">
                    <h4 class="text-lg font-black text-base-content mb-3 tracking-tight">
                      {{ iface.name }}
                    </h4>
                    <p class="text-base text-base-content/50 mb-6 font-medium leading-relaxed">
                      {{ iface.description }}
                    </p>
                    <app-docs-api-table
                      [columns]="[
                        { key: 'name', header: 'Property', cellClass: '' },
                        { key: 'type', header: 'Type', cellClass: '' },
                        { key: 'description', header: 'Description', cellClass: 'docs-cell-desc' },
                      ]"
                      [rows]="iface.properties"
                    />
                  </div>
                }
              }
            </div>
          }
          @case ('example') {
            <div class="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <app-code-block language="ts" filename="usage.example.ts" [code]="exampleCode()" />
            </div>
          }
        }
      }
    </div>
  `,
  styles: [],
})
export class UnifiedServiceDetailComponent {
  /** Config provided by router resolver via withComponentInputBinding */
  readonly config = input<ServiceDetailConfig | undefined>(undefined);

  protected readonly contentTabs: DocTab[] = [
    { id: 'api', label: 'API Reference' },
    { id: 'example', label: 'Example' },
  ];

  /** First tab selected by default */
  protected activeTab = signal<string>('api');
  protected apiVariant = signal<'service' | 'fn'>('service');

  protected service = computed(() => this.config()?.service);

  // Expose column constants to template
  protected readonly INPUTS_COLUMNS = INPUTS_COLUMNS;
  protected readonly OUTPUTS_COLUMNS = OUTPUTS_COLUMNS;

  protected hasInputs = computed(() => {
    const s = this.service();
    return !!s && !!s.inputs && s.inputs.length > 0;
  });

  protected hasOutputs = computed(() => {
    const s = this.service();
    return !!s && !!s.outputs && s.outputs.length > 0;
  });

  protected hasMethods = computed(() => {
    const s = this.service();
    if (!s) return false;
    if (this.apiVariant() === 'fn' && s.fnVersion) {
      return s.fnVersion.fields.length > 0;
    }
    return s.methods.length > 0;
  });

  protected inputRows = computed<ApiRow[]>(() => {
    const s = this.service();
    if (!s?.inputs) return [];
    return s.inputs.map((input) => ({
      name: input.name,
      type: input.type,
      defaultValue: input.defaultValue ?? '-',
      description: input.description,
    }));
  });

  protected outputRows = computed<ApiRow[]>(() => {
    const s = this.service();
    if (!s?.outputs) return [];
    return s.outputs.map((output) => ({
      name: output.name,
      type: output.type,
      description: output.description,
    }));
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

  protected exampleCode = computed(() => {
    const s = this.service();
    if (!s) return '';
    if (this.apiVariant() === 'fn' && s.fnVersion?.example) {
      return s.fnVersion.example;
    }
    return s.example;
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
