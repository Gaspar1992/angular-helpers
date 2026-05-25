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
  GuideFile,
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
                [attr.aria-pressed]="apiVariant() === 'service'"
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
                [attr.aria-pressed]="apiVariant() === 'fn'"
                (click)="apiVariant.set('fn')"
              >
                Function
              </button>
            </div>
          </div>
        }

        <app-docs-tabs
          [tabs]="contentTabs()"
          [activeTab]="activeTab()"
          (tabChange)="activeTab.set($event)"
        />

        @switch (activeTab()) {
          @case ('api') {
            <div
              id="panel-api"
              role="tabpanel"
              aria-labelledby="tab-api"
              class="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
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
            <div
              id="panel-example"
              role="tabpanel"
              aria-labelledby="tab-example"
              class="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <app-code-block language="ts" filename="usage.example.ts" [code]="exampleCode()" />
            </div>
          }
          @case ('guides') {
            <div
              id="panel-guides"
              role="tabpanel"
              aria-labelledby="tab-guides"
              class="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col gap-12"
            >
              @for (guide of s.guides; track guide.title; let idx = $index) {
                <div
                  class="p-8 sm:p-10 bg-base-200/50 backdrop-blur-md border border-border-subtle rounded-3xl shadow-sm relative overflow-hidden"
                >
                  <div
                    class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"
                  ></div>

                  <h3
                    class="text-xl sm:text-2xl font-black text-base-content tracking-tight mb-4 flex items-center gap-3"
                  >
                    <span
                      class="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-black"
                      >{{ idx + 1 }}</span
                    >
                    {{ guide.title }}
                  </h3>

                  <p
                    class="text-base text-base-content/75 font-medium leading-relaxed mb-8 max-w-[800px] whitespace-pre-line"
                  >
                    {{ guide.description }}
                  </p>

                  @if (guide.files && guide.files.length > 0) {
                    <div
                      class="grid grid-cols-1 md:grid-cols-4 gap-6 bg-base-300/30 border border-border-subtle rounded-3xl p-4 min-h-[400px]"
                    >
                      <!-- Left Explorer Pane -->
                      <div
                        class="col-span-1 flex flex-col gap-2 bg-base-200/60 p-4 rounded-2xl border border-border-subtle h-fit"
                      >
                        <span
                          class="text-[0.6rem] font-black uppercase tracking-widest text-base-content/40 mb-2 ml-1"
                          >📂 Explorer</span
                        >
                        <div class="flex flex-col gap-1">
                          @for (file of guide.files; track file.name) {
                            <button
                              type="button"
                              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold font-mono transition-all select-none w-full cursor-pointer"
                              [class.bg-primary]="
                                getActiveFile(idx, guide.files).name === file.name
                              "
                              [class.text-primary-content]="
                                getActiveFile(idx, guide.files).name === file.name
                              "
                              [class.shadow-md]="getActiveFile(idx, guide.files).name === file.name"
                              [class.bg-base-content/5]="
                                getActiveFile(idx, guide.files).name !== file.name
                              "
                              [class.text-base-content/60]="
                                getActiveFile(idx, guide.files).name !== file.name
                              "
                              [class.hover:bg-base-content/10]="
                                getActiveFile(idx, guide.files).name !== file.name
                              "
                              [class.hover:text-base-content]="
                                getActiveFile(idx, guide.files).name !== file.name
                              "
                              (click)="selectFile(idx, file.name)"
                            >
                              @if (file.name.endsWith('.ts')) {
                                <span
                                  class="text-[0.55rem] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded font-black tracking-wide"
                                  >TS</span
                                >
                              } @else if (file.name.endsWith('.html')) {
                                <span
                                  class="text-[0.55rem] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded font-black tracking-wide"
                                  >HTML</span
                                >
                              } @else {
                                <span
                                  class="text-[0.55rem] bg-base-content/10 text-base-content/50 border border-border px-1 py-0.5 rounded font-black tracking-wide"
                                  >TXT</span
                                >
                              }
                              <span class="truncate flex-1">{{ file.name }}</span>
                            </button>
                          }
                        </div>
                      </div>

                      <!-- Right Code Pane -->
                      <div class="col-span-1 md:col-span-3 flex flex-col justify-between">
                        <div class="animate-in fade-in duration-300">
                          <app-code-block
                            [language]="getActiveFile(idx, guide.files).language"
                            [filename]="getActiveFile(idx, guide.files).name"
                            [code]="getActiveFile(idx, guide.files).content"
                          />
                        </div>
                      </div>
                    </div>
                  } @else {
                    <app-code-block
                      language="ts"
                      [filename]="'pattern-' + (idx + 1) + '.ts'"
                      [code]="guide.code || ''"
                    />
                  }
                </div>
              }
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

  protected readonly contentTabs = computed<DocTab[]>(() => {
    const s = this.service();
    const tabs: DocTab[] = [
      { id: 'api', label: 'API Reference' },
      { id: 'example', label: 'Example' },
    ];
    if (s?.guides && s.guides.length > 0) {
      tabs.push({ id: 'guides', label: 'Guides & Patterns' });
    }
    return tabs;
  });

  /** First tab selected by default */
  protected activeTab = signal<string>('api');
  protected apiVariant = signal<'service' | 'fn'>('service');

  protected service = computed(() => this.config()?.service);

  protected readonly activeFiles = signal<Record<number, string>>({});

  protected getActiveFile(guideIdx: number, files: GuideFile[]): GuideFile {
    const activeMap = this.activeFiles();
    const activeName = activeMap[guideIdx];
    if (activeName) {
      const match = files.find((f) => f.name === activeName);
      if (match) return match;
    }
    return files[0];
  }

  protected selectFile(guideIdx: number, fileName: string) {
    this.activeFiles.update((map) => ({ ...map, [guideIdx]: fileName }));
  }

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
