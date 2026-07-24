import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-demo-city-card',
  template: `
    <div
      class="bg-transparent backdrop-blur-md border border-base-content/10 rounded-2xl shadow-2xl p-5 min-w-[200px] text-sm"
    >
      <div class="flex items-center gap-3 mb-3 pb-3 border-b border-base-content/5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          🏙️
        </div>
        <div class="font-black text-base-content tracking-tight text-base">{{ name() }}</div>
      </div>
      <div class="space-y-3 mb-4">
        <div class="flex justify-between">
          <span class="text-base-content/40 font-bold uppercase text-[10px]">Population</span>
          <span class="text-base-content font-mono font-bold">{{
            population().toLocaleString()
          }}</span>
        </div>
      </div>
      <button
        class="btn btn-xs btn-primary btn-outline w-full rounded-lg font-bold"
        (click)="closed.emit()"
      >
        Close popup
      </button>
    </div>
  `,
})
export class DemoCityCardComponent {
  readonly name = input.required<string>();
  readonly population = input.required<number>();
  readonly closed = output<void>();
}
