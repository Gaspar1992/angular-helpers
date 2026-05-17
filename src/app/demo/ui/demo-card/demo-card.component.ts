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
      class="bg-base-200 border border-base-content/5 rounded-3xl p-8 transition-all duration-300 shadow-sm relative overflow-hidden group hover:border-primary/40 hover:shadow-2xl"
      [class.ring-1]="featured()"
      [class.ring-primary/30]="featured()"
    >
      @if (featured()) {
        <div
          class="absolute top-0 right-0 p-1 bg-primary text-base-content text-[8px] font-black uppercase tracking-widest rounded-bl-lg px-2"
        >
          Featured
        </div>
      }

      <div class="flex items-start justify-between gap-4 mb-6">
        <div class="flex-1 min-w-0">
          <h3
            class="text-xl font-black text-base-content m-0 mb-3 tracking-tight group-hover:text-primary transition-colors"
          >
            {{ title() }}
          </h3>
          @if (description()) {
            <p class="text-base text-base-content/50 m-0 leading-relaxed font-medium">
              {{ description() }}
            </p>
          }
        </div>
        @if (badge()) {
          <span class="badge font-bold px-3 py-1 shrink-0" [class]="badgeCls()">{{ badge() }}</span>
        }
      </div>

      @if (supported() !== undefined) {
        <div class="flex items-center gap-3 mb-6">
          <div
            class="flex items-center gap-2 px-3 py-1 rounded-full border shadow-inner text-[10px] font-black uppercase tracking-widest"
            [class.bg-success/10]="supported()"
            [class.border-success/20]="supported()"
            [class.text-success]="supported()"
            [class.bg-base-content/5]="!supported()"
            [class.border-base-content/10]="!supported()"
            [class.text-base-content/20]="!supported()"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              [class.bg-success]="supported()"
              [class.bg-base-content/20]="!supported()"
            ></span>
            <span>{{ supported() ? 'API Ready' : 'Incompatible' }}</span>
          </div>
        </div>
      }

      <div class="mb-6 empty:mb-0 relative z-10">
        <ng-content />
      </div>

      @if (actionLabel()) {
        <div class="flex justify-end pt-6 border-t border-base-content/5 mt-auto">
          <button
            class="btn btn-primary font-black px-6 rounded-xl shadow-lg shadow-primary/20"
            (click)="action.emit()"
          >
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
