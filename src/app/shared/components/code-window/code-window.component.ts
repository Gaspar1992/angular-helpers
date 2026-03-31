import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-code-window',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './code-window.component.css',
  template: `
    <div class="code-window">
      <div class="window-chrome" aria-hidden="true">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
        <span class="window-title">{{ title() }}</span>
      </div>
      <pre class="window-body"><code [innerHTML]="code()"></code></pre>
    </div>
  `,
})
export class CodeWindowComponent {
  readonly title = input.required<string>();
  readonly code = input.required<string>();
}
