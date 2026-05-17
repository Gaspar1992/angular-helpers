import {
  Component,
  input,
  AfterViewInit,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
  effect,
  computed,
  signal,
} from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
};

@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block-wrapper">
      <header class="code-header">
        <span class="lang-badge">{{ displayLanguage() }}</span>
        <button
          class="copy-btn"
          (click)="copy()"
          [attr.aria-label]="'Copy ' + displayLanguage() + ' code'"
        >
          {{ copied() ? 'Copied!' : 'Copy' }}
        </button>
      </header>
      <pre><code #codeEl class="language-{{ normalizedLanguage() }}">{{ code() }}</code></pre>
    </div>
  `,
  styles: [
    `
      @reference "../../../../styles.css";

      .code-block-wrapper {
        background: var(--c-bg-surface);
        border-radius: 12px;
        overflow: hidden;
        margin-block: var(--space-4);
        border: 1px solid var(--c-border);
        box-shadow: 0 4px 20px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3));

        /* Native Nesting */
        .code-header {
          @apply flex justify-between items-center px-4 py-2 bg-base-200 border-b border-border-subtle;

          .lang-badge {
            @apply text-[0.6rem] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/25 font-mono;
          }

          .copy-btn {
            @apply text-[0.65rem] font-black px-4 py-1.5 bg-base-content/5 border border-border-subtle rounded-full text-base-content/60 cursor-pointer uppercase tracking-wider transition-all duration-150;

            &:hover {
              @apply bg-base-content/10 text-base-content border-base-content/50;
            }

            &:focus-visible {
              @apply outline-2 outline-primary outline-offset-2;
            }
          }
        }

        pre {
          margin: 0;
          padding: var(--space-4) var(--space-6);
          overflow-x: auto;
          background: transparent;
        }

        code {
          font-family: var(--font-mono);
          font-size: var(--fs-sm);
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-word;

          /* Fluid typography adaptation */
          @container (width > 600px) {
            font-size: var(--fs-base);
            white-space: pre;
            word-break: normal;
          }
        }
      }
    `,
  ],
})
export class CodeBlockComponent implements AfterViewInit {
  readonly code = input.required<string>();
  readonly language = input<string>('typescript');

  protected normalizedLanguage = computed(() => {
    const lang = this.language();
    return LANGUAGE_ALIASES[lang] ?? lang;
  });

  protected displayLanguage = computed(() => {
    const lang = this.language();
    if (lang === 'ts') return 'TypeScript';
    if (lang === 'js') return 'JavaScript';
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  });

  protected codeEl = viewChild.required<ElementRef<HTMLElement>>('codeEl');
  protected copied = signal(false);

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
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
