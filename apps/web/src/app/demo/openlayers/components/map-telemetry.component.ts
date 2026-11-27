import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-telemetry',
  imports: [CommonModule],
  template: `
    <div
      class="bg-base-200 rounded-3xl overflow-hidden shadow-2xl border border-base-content/5 flex-grow"
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
            class="text-info"
          >
            <path d="M2 12h4l2-9 5 18 3-10 5 3"></path>
          </svg>
          Map Telemetry
        </h2>

        <div class="flex flex-col gap-4 mb-8">
          <div class="bg-base-content/5 rounded-2xl p-5 shadow-inner border border-base-content/5">
            <div class="text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-1">
              Center Coordinates
            </div>
            <div class="text-xl font-mono tracking-tighter text-base-content font-black">
              {{ center()[0].toFixed(4) }}<span class="mx-1 opacity-20">,</span
              >{{ center()[1].toFixed(4) }}
            </div>
          </div>
          <div class="bg-base-content/5 rounded-2xl p-5 shadow-inner border border-base-content/5">
            <div class="text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-1">
              Zoom Level
            </div>
            <div class="text-2xl font-mono tracking-tighter text-info font-black">
              {{ zoom() | number: '1.1-2' }}
            </div>
          </div>
        </div>

        <h3 class="text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-4 px-1">
          Pointer Inspection
        </h3>
        <div
          class="bg-base-content/5 rounded-2xl p-6 border border-base-content/5 font-mono text-sm shadow-inner min-h-[140px] flex flex-col justify-center"
        >
          @if (lastClick(); as click) {
            <div class="space-y-4 animate-in fade-in duration-300">
              <div class="flex justify-between items-center pb-4 border-b border-base-content/5">
                <span class="text-[10px] font-bold uppercase text-base-content/30">Coord</span>
                <span class="font-bold text-success"
                  >{{ click.coordinate?.[0]?.toFixed(4) }}<span class="mx-1 opacity-40">,</span
                  >{{ click.coordinate?.[1]?.toFixed(4) }}</span
                >
              </div>
              <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold uppercase text-base-content/30">Viewport</span>
                <span class="font-bold text-base-content/80"
                  >{{ click.pixel?.[0] | number: '1.0-0' }}px<span class="mx-1 opacity-40">,</span
                  >{{ click.pixel?.[1] | number: '1.0-0' }}px</span
                >
              </div>
            </div>
          } @else {
            <div
              class="flex flex-col items-center justify-center h-full text-base-content/10 italic gap-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="opacity-10"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="12" y1="2" x2="12" y2="22" />
              </svg>
              <span class="text-[10px] font-black uppercase tracking-[0.2em]">Idle Inspection</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class MapTelemetryComponent {
  readonly center = input.required<number[]>();
  readonly zoom = input.required<number>();
  readonly lastClick = input<any>();
}
