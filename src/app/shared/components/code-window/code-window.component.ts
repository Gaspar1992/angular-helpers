import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CodeTab {
  title: string;
  html: string;
  raw?: string;
}

@Component({
  selector: 'app-code-window',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="code-window-container group">
      <!-- Glossy Top Highlight -->
      <div class="glossy-highlight" aria-hidden="true"></div>

      <!-- Header -->
      <header>
        <!-- Mac Buttons & Tabs -->
        <div class="header-main">
          <div class="mac-buttons" aria-hidden="true">
            <span class="dot close"></span>
            <span class="dot minimize"></span>
            <span class="dot maximize"></span>
          </div>

          <nav class="tabs" role="tablist">
            @for (tab of tabs(); track tab.title; let i = $index) {
              <button
                role="tab"
                class="tab-btn"
                [class.active]="activeTab() === i"
                [attr.aria-selected]="activeTab() === i"
                (click)="activeTab.set(i)"
              >
                {{ tab.title }}
              </button>
            }
          </nav>
        </div>

        <!-- Copy Button -->
        <button
          class="copy-btn"
          (click)="copyCode()"
          [title]="copied() ? 'Copied!' : 'Copy to clipboard'"
          aria-label="Copy code"
        >
          @if (copied()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#28ca41"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          } @else {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          }
        </button>
      </header>

      <!-- Content -->
      <main class="code-content">
        <div class="noise-overlay" aria-hidden="true"></div>
        <pre
          class="no-scrollbar"
          tabindex="0"
          role="region"
          [attr.aria-label]="tabs()[activeTab()].title + ' code snippet'"
        ><code [innerHTML]="tabs()[activeTab()].html"></code></pre>
      </main>
    </div>
  `,
  styles: [
    `
      .code-window-container {
        container-type: inline-size;
        background-color: var(--c-bg-surface);
        border: 1px solid var(--c-border);
        border-radius: var(--radius-xl);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        block-size: 100%;
        position: relative;
        box-shadow: 0 20px 50px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4));
        transition: transform var(--t-fast);

        &:hover {
          box-shadow: 0 30px 60px light-dark(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.6));
        }

        .glossy-highlight {
          position: absolute;
          inset-block-start: 0;
          inset-inline: 0;
          block-size: 1px;
          background: linear-gradient(
            to right,
            transparent,
            color-mix(in oklch, white, transparent 80%),
            transparent
          );
          z-index: 20;
        }

        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-inline: var(--spacing-4);
          background-color: color-mix(in oklch, var(--c-bg-surface), black 2%);
          border-block-end: 1px solid var(--c-border-subtle);
          user-select: none;
          z-index: 10;
          min-block-size: var(--spacing-12);

          .header-main {
            display: flex;
            align-items: center;
            gap: var(--spacing-4);

            .mac-buttons {
              display: flex;
              gap: var(--spacing-1-5);

              .dot {
                inline-size: 10px;
                block-size: 10px;
                border-radius: var(--radius-full);
                background-color: var(--c-border);
                transition: background-color var(--t-fast);

                &.close:hover {
                  background-color: #ff5f57;
                }
                &.minimize:hover {
                  background-color: #ffbd2e;
                }
                &.maximize:hover {
                  background-color: #28ca41;
                }
              }
            }

            .tabs {
              display: flex;
              gap: var(--spacing-1);

              .tab-btn {
                padding-inline: var(--spacing-3);
                padding-block: var(--spacing-2);
                font-family: var(--font-mono);
                font-size: 11px;
                color: var(--c-text-muted);
                background: transparent;
                border: none;
                border-block-end: 2px solid transparent;
                cursor: pointer;
                transition: all var(--t-fast);

                &:hover {
                  color: var(--c-text-secondary);
                  background-color: var(--c-border-subtle);
                }

                &.active {
                  color: var(--c-text-main);
                  border-block-end-color: var(--c-primary);
                }
              }
            }
          }

          .copy-btn {
            color: var(--c-text-muted);
            padding: var(--spacing-1-5);
            border-radius: var(--radius-md);
            border: 1px solid transparent;
            background: transparent;
            cursor: pointer;
            transition: all var(--t-fast);
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover {
              color: var(--c-text-main);
              background-color: var(--c-border-subtle);
              border-color: var(--c-border);
            }

            &:active {
              transform: scale(0.95);
            }
          }
        }

        .code-content {
          position: relative;
          flex: 1;
          background-color: var(--c-bg-main);

          .noise-overlay {
            position: absolute;
            inset: 0;
            opacity: 0.02;
            mix-blend-mode: overlay;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          }

          pre {
            margin: 0;
            padding: var(--spacing-6);
            overflow-x: auto;
            block-size: 100%;
          }

          code {
            font-family: var(--font-mono);
            font-size: var(--fs-sm);
            line-height: 1.7;
            color: var(--c-text-main);
          }
        }

        /* Container Query for small widths */
        @container (inline-size < 400px) {
          header .header-main {
            gap: var(--spacing-2);
            .mac-buttons {
              display: none;
            }
          }
        }
      }
    `,
  ],
})
export class CodeWindowComponent {
  readonly tabs = input.required<CodeTab[]>();

  activeTab = signal(0);
  copied = signal(false);

  copyCode() {
    const rawCode = this.tabs()[this.activeTab()].raw;
    if (!rawCode) return; // In a real app we might extract text from HTML if raw is missing

    navigator.clipboard.writeText(rawCode).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
