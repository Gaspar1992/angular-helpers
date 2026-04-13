import {
  Component,
  input,
  AfterViewInit,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
  effect,
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
        <button
          class="copy-btn"
          (click)="copy()"
          [attr.aria-label]="'Copy ' + language() + ' code'"
        >
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <pre><code #codeEl class="language-{{ language() }}">{{ code() }}</code></pre>
    </div>
  `,
  styles: [
    `
      .code-block-wrapper {
        background: var(--bg-elevated);
        border-radius: var(--radius-lg);
        overflow: hidden;
        margin: var(--sp-4) 0;
        border: 1px solid var(--border-color);
      }

      .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--sp-2) var(--sp-4);
        background: rgba(255, 255, 255, 0.04);
        border-bottom: 1px solid var(--border-subtle);
      }

      .lang-badge {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }

      .copy-btn {
        font-size: var(--text-xs);
        padding: 0.2rem 0.6rem;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: #c0c8e0;
        cursor: pointer;
        transition:
          background var(--transition),
          color var(--transition);
      }

      .copy-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: var(--text-white);
      }

      .copy-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      pre {
        margin: 0;
        padding: var(--sp-5) var(--sp-6);
        overflow-x: auto;
      }

      code {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.65;
        background: transparent !important;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      @media (min-width: 640px) {
        code {
          font-size: var(--text-base);
          white-space: pre;
          word-break: normal;
        }
      }
    `,
  ],
})
export class CodeBlockComponent implements AfterViewInit {
  readonly code = input.required<string>();
  readonly language = input<string>('typescript');

  protected codeEl = viewChild.required<ElementRef<HTMLElement>>('codeEl');
  protected copied = false;

  constructor() {
    effect(() => {
      const codeValue = this.code();
      const el = this.codeEl();
      if (el) {
        el.nativeElement.textContent = codeValue;
        hljs.highlightElement(el.nativeElement);
      }
    });
  }

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
