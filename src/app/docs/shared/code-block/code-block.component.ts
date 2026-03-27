import {
  Component,
  input,
  AfterViewInit,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);

@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block-wrapper">
      <div class="code-header">
        <span class="lang-badge">{{ language() }}</span>
        <button class="copy-btn" (click)="copy()" [attr.aria-label]="'Copy ' + language() + ' code'">
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <pre><code #codeEl class="language-{{ language() }}">{{ code() }}</code></pre>
    </div>
  `,
  styles: [
    `
      .code-block-wrapper {
        background: #1e1e2e;
        border-radius: 8px;
        overflow: hidden;
        margin: 1rem 0;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .lang-badge {
        font-size: 0.75rem;
        font-weight: 600;
        color: #a0a8c0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .copy-btn {
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        color: #c0c8e0;
        cursor: pointer;
        transition: background 0.15s;
      }

      .copy-btn:hover {
        background: rgba(255, 255, 255, 0.18);
      }

      .copy-btn:focus-visible {
        outline: 2px solid #6b8cf2;
        outline-offset: 2px;
      }

      pre {
        margin: 0;
        padding: 1.2rem 1.4rem;
        overflow-x: auto;
      }

      code {
        font-family:
          'Fira Code',
          'Cascadia Code',
          'Consolas',
          monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        background: transparent !important;
      }
    `,
  ],
})
export class CodeBlockComponent implements AfterViewInit {
  readonly code = input.required<string>();
  readonly language = input<string>('typescript');

  protected codeEl = viewChild.required<ElementRef<HTMLElement>>('codeEl');
  protected copied = false;

  ngAfterViewInit() {
    hljs.highlightElement(this.codeEl().nativeElement);
  }

  protected copy() {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }
}
