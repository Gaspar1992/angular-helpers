import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EyeDropperService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-eye-dropper-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="eye-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="eye-title">
          EyeDropper API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (eyeDropper.isSupported()) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>

      <p class="text-sm text-base-content/70 mb-4">
        Pick any color from your screen using the system color picker.
      </p>

      @if (eyeDropper.isSupported()) {
        <button class="btn btn-primary btn-sm" (click)="pickColor()">Open EyeDropper</button>
        @if (selectedColor()) {
          <div
            class="mt-4 flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-300"
          >
            <div
              class="w-10 h-10 rounded shadow-inner"
              [style.backgroundColor]="selectedColor()"
            ></div>
            <div>
              <div class="text-xs opacity-60 uppercase font-bold">Selected Color</div>
              <code class="text-sm font-mono">{{ selectedColor() }}</code>
            </div>
          </div>
        }
      } @else {
        <div class="alert alert-warning py-2 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-current shrink-0 w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>This browser does not support the EyeDropper API.</span>
        </div>
      }
    </section>
  `,
})
export class EyeDropperDemoComponent {
  readonly eyeDropper = inject(EyeDropperService);
  readonly selectedColor = signal('');

  async pickColor() {
    try {
      const result = await this.eyeDropper.open();
      this.selectedColor.set(result.sRGBHex);
    } catch (e) {
      console.error('EyeDropper canceled or failed', e);
    }
  }
}
