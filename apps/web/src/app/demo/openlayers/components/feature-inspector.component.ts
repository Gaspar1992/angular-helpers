import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-inspector',
  imports: [CommonModule],
  template: `
    @if (selectedFeatures().length > 0) {
      <div
        class="bg-base-200 rounded-3xl overflow-hidden shadow-2xl border border-base-content/5 animate-in fade-in slide-in-from-right-4 duration-300"
      >
        <div class="p-8">
          <h2 class="text-xl font-bold flex items-center gap-3 mb-6 text-base-content">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-primary"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Inspector
          </h2>

          @let feature = selectedFeatures()[0];
          <div class="space-y-6">
            <div
              class="bg-base-content/5 rounded-2xl p-5 shadow-inner border border-base-content/5"
            >
              <span
                class="text-[10px] font-black uppercase tracking-widest text-base-content/30 block mb-1"
                >Feature ID</span
              >
              <div class="font-mono text-xs break-all text-base-content/80">
                {{ feature.id }}
              </div>
            </div>

            @if (feature.id && (feature.id.toString().startsWith('drawn-') || !feature.properties?.['population'])) {
              <!-- Cyber-Premium Style & Label Editor -->
              <div class="space-y-4">
                <div class="divider my-1 opacity-5"></div>
                
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-base-content/30 block mb-2 px-1">Label / Annotation</label>
                  <input
                    type="text"
                    [value]="feature.properties?.['name'] || ''"
                    (input)="onUpdate(feature.id, { name: $any($event.target).value })"
                    class="input input-sm input-bordered w-full rounded-xl bg-base-content/5 border-base-content/10 font-bold focus:outline-none focus:border-primary/40 text-base-content"
                    placeholder="e.g. Area A"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-black uppercase tracking-widest text-base-content/30 block mb-2 px-1">Stroke Color</label>
                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        [value]="feature.properties?.['strokeColor'] || '#3b82f6'"
                        (input)="onUpdate(feature.id, { strokeColor: $any($event.target).value })"
                        class="w-10 h-8 rounded-lg cursor-pointer border border-base-content/10 bg-transparent"
                      />
                      <span class="text-xs font-mono font-bold text-base-content/70">{{ feature.properties?.['strokeColor'] || '#3b82f6' }}</span>
                    </div>
                  </div>

                  <div>
                    <label class="text-[10px] font-black uppercase tracking-widest text-base-content/30 block mb-2 px-1">Fill Color</label>
                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        [value]="feature.properties?.['fillColor'] || '#3b82f6'"
                        (input)="onUpdate(feature.id, { fillColor: $any($event.target).value })"
                        class="w-10 h-8 rounded-lg cursor-pointer border border-base-content/10 bg-transparent"
                      />
                      <span class="text-xs font-mono font-bold text-base-content/70">{{ feature.properties?.['fillColor'] || '#3b82f6' }}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-2 px-1">
                    <span>Stroke Width</span>
                    <span class="font-bold text-base-content">{{ feature.properties?.['strokeWidth'] || 2 }}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    [value]="feature.properties?.['strokeWidth'] || 2"
                    (input)="onUpdate(feature.id, { strokeWidth: +$any($event.target).value })"
                    class="range range-primary range-xs"
                  />
                </div>

                <div>
                  <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-2 px-1">
                    <span>Fill Transparency</span>
                    <span class="font-bold text-base-content">{{ (+$any(feature.properties?.['fillOpacity'] ?? 0.2) * 100).toFixed(0) }}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    [value]="feature.properties?.['fillOpacity'] ?? 0.2"
                    (input)="onUpdate(feature.id, { fillOpacity: +$any($event.target).value })"
                    class="range range-primary range-xs"
                  />
                </div>
              </div>
            } @else {
              @if (feature.properties?.['name']) {
                <div
                  class="bg-base-content/5 rounded-2xl p-5 shadow-inner border border-base-content/5"
                >
                  <span
                    class="text-[10px] font-black uppercase tracking-widest text-base-content/30 block mb-1"
                    >Name</span
                  >
                  <div class="text-lg font-black text-base-content tracking-tight">
                    {{ feature.properties!['name'] }}
                  </div>
                </div>
              }
            }

            <button
              class="btn btn-sm btn-ghost w-full font-bold text-base-content/40 hover:text-error hover:bg-error/10 rounded-xl transition-all"
              (click)="deselect.emit()"
            >
              Deselect Feature
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class FeatureInspectorComponent {
  readonly selectedFeatures = input.required<any[]>();
  readonly updateStyle = output<{
    id: string | number;
    updates: {
      name?: string;
      strokeColor?: string;
      strokeWidth?: number;
      fillColor?: string;
      fillOpacity?: number;
    };
  }>();
  readonly deselect = output<void>();

  onUpdate(id: string | number, updates: any): void {
    this.updateStyle.emit({ id, updates });
  }
}
