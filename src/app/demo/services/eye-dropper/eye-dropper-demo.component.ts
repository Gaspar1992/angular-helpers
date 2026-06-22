import { Component, inject, signal } from '@angular/core';
import { EyeDropperService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-eye-dropper-demo',
  imports: [],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="eye-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="eye-title">
          <span class="text-primary text-2xl">🧪</span> EyeDropper API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (eyeDropper.isSupported()) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge badge-info font-black">secure context</span>
        </div>
      </div>

      <p class="svc-desc">
        Pick any color from your screen using the system color picker. Sample colors from the
        browser window or even outside of it.
      </p>

      @if (eyeDropper.isSupported()) {
        <div class="svc-controls mb-8">
          <button class="btn btn-primary font-black" (click)="pickColor()">Open EyeDropper</button>
        </div>

        @if (selectedColor()) {
          <div class="svc-result animate-in zoom-in-95 duration-500 shadow-2xl">
            <div class="flex items-center gap-8">
              <div
                class="w-24 h-24 rounded-[2rem] shadow-2xl border-4 border-base-content/10 ring-8 ring-white/5"
                [style.backgroundColor]="selectedColor()"
              ></div>
              <div class="flex-1">
                <div class="kv-row">
                  <span class="kv-key">Hex Value</span>
                  <span class="kv-val text-2xl font-black tracking-tighter text-primary">{{
                    selectedColor()
                  }}</span>
                </div>
                <div class="kv-row border-none">
                  <span class="kv-key">Status</span>
                  <span class="badge badge-success font-black">Captured</span>
                </div>
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="feedback feedback-error mt-6">
          <span class="text-2xl">⚠️</span>
          <span>This browser does not support the EyeDropper API. Try Chrome or Edge.</span>
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
    } catch {
      // ignore
    }
  }
}
