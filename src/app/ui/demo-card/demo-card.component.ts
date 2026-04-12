import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export type DemoCardVariant = 'default' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-demo-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-card" [class.demo-card--featured]="featured()">
      <div class="demo-card-header">
        <div class="demo-card-meta">
          <h3 class="demo-card-title">{{ title() }}</h3>
          @if (description()) {
            <p class="demo-card-description">{{ description() }}</p>
          }
        </div>
        @if (badge()) {
          <span class="demo-card-badge" [class]="'demo-card-badge--' + badgeVariant()">
            {{ badge() }}
          </span>
        }
      </div>

      @if (supported() !== undefined) {
        <div
          class="demo-card-support"
          [class.supported]="supported()"
          [class.unsupported]="!supported()"
        >
          <span class="support-indicator"></span>
          <span class="support-text">{{ supported() ? 'Supported' : 'Not Supported' }}</span>
        </div>
      }

      <div class="demo-card-content">
        <ng-content />
      </div>

      @if (actionLabel()) {
        <div class="demo-card-footer">
          <button class="demo-card-action" (click)="action.emit()">
            {{ actionLabel() }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .demo-card {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: var(--sp-5);
        transition: all var(--transition);
      }

      .demo-card:hover {
        border-color: var(--accent);
        box-shadow: 0 4px 20px -4px rgba(99, 102, 241, 0.15);
      }

      .demo-card--featured {
        border-color: var(--accent);
        background: linear-gradient(135deg, var(--bg-elevated), rgba(99, 102, 241, 0.05));
      }

      .demo-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--sp-4);
        margin-bottom: var(--sp-4);
      }

      .demo-card-meta {
        flex: 1;
        min-width: 0;
      }

      .demo-card-title {
        font-size: var(--text-lg);
        font-weight: 600;
        margin: 0 0 var(--sp-2);
        color: var(--text);
      }

      .demo-card-description {
        font-size: var(--text-sm);
        color: var(--text-muted);
        margin: 0;
        line-height: 1.5;
      }

      .demo-card-badge {
        display: inline-flex;
        align-items: center;
        padding: var(--sp-1) var(--sp-2);
        border-radius: var(--radius);
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }

      .demo-card-badge--default {
        background: rgba(99, 102, 241, 0.15);
        color: var(--accent);
      }

      .demo-card-badge--success {
        background: rgba(80, 200, 120, 0.15);
        color: #50c878;
      }

      .demo-card-badge--warning {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }

      .demo-card-badge--error {
        background: rgba(255, 80, 80, 0.15);
        color: #ff5050;
      }

      .demo-card-support {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        margin-bottom: var(--sp-4);
        font-size: var(--text-xs);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .demo-card-support.supported {
        color: #50c878;
      }

      .demo-card-support.unsupported {
        color: var(--text-muted);
      }

      .support-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .demo-card-content {
        margin-bottom: var(--sp-4);
      }

      .demo-card-content:empty {
        margin-bottom: 0;
      }

      .demo-card-footer {
        display: flex;
        justify-content: flex-end;
        padding-top: var(--sp-4);
        border-top: 1px solid var(--border);
      }

      .demo-card-action {
        display: inline-flex;
        align-items: center;
        padding: var(--sp-2) var(--sp-4);
        background: var(--accent);
        color: white;
        border: none;
        border-radius: var(--radius);
        font-size: var(--text-sm);
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition);
      }

      .demo-card-action:hover {
        background: var(--accent-light);
        transform: translateY(-1px);
      }

      .demo-card-action:active {
        transform: translateY(0);
      }
    `,
  ],
})
export class DemoCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly badge = input<string>();
  readonly badgeVariant = input<DemoCardVariant>('default');
  readonly supported = input<boolean>();
  readonly featured = input(false);
  readonly actionLabel = input<string>();

  readonly action = output<void>();
}
