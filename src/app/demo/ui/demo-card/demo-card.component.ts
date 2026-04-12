import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export type DemoCardVariant = 'default' | 'success' | 'warning' | 'error';

const BADGE_CLASSES: Record<DemoCardVariant, string> = {
  default: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
};

@Component({
  selector: 'app-demo-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-base-200 border border-base-300 rounded-xl p-5 transition-all duration-150"
      [class.border-primary]="featured()"
      [class.bg-primary/5]="featured()"
    >
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-base-content m-0 mb-2">{{ title() }}</h3>
          @if (description()) {
            <p class="text-sm text-base-content/80 m-0 leading-snug">{{ description() }}</p>
          }
        </div>
        @if (badge()) {
          <span class="badge badge-sm shrink-0" [class]="badgeCls()">{{ badge() }}</span>
        }
      </div>

      @if (supported() !== undefined) {
        <div class="flex items-center gap-2 mb-4 text-xs font-medium uppercase tracking-wide">
          <span
            class="w-2 h-2 rounded-full"
            [class.bg-success]="supported()"
            [class.bg-base-content/20]="!supported()"
          ></span>
          <span [class.text-success]="supported()" [class.text-base-content/40]="!supported()">
            {{ supported() ? 'Supported' : 'Not Supported' }}
          </span>
        </div>
      }

      <div class="mb-4 empty:mb-0">
        <ng-content />
      </div>

      @if (actionLabel()) {
        <div class="flex justify-end pt-4 border-t border-base-300">
          <button class="btn btn-primary btn-sm" (click)="action.emit()">
            {{ actionLabel() }}
          </button>
        </div>
      }
    </div>
  `,
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

  protected badgeCls(): string {
    return BADGE_CLASSES[this.badgeVariant()];
  }
}
