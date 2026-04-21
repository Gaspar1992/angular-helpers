import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-code-window',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-neutral border border-base-300 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <div
        class="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border-b border-base-300/60"
        aria-hidden="true"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#28ca41]"></span>
        <span class="ml-2 text-[0.72rem] text-base-content/70 font-mono">{{ title() }}</span>
      </div>
      <pre
        class="m-0 px-5 py-4 overflow-x-auto"
        tabindex="0"
        role="region"
        [attr.aria-label]="title() + ' code snippet'"
      ><code class="font-mono text-[0.8rem] leading-[1.7] block" [innerHTML]="code()"></code></pre>
    </div>
  `,
})
export class CodeWindowComponent {
  readonly title = input.required<string>();
  readonly code = input.required<string>();
}
