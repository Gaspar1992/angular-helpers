import { Component, OnDestroy, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { IdleDetectorService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-idle-detector-demo',
  providers: [IdleDetectorService],
  imports: [UpperCasePipe],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="idle-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="idle-title">
          <span class="text-primary text-2xl">💤</span> IdleDetector API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          @if (watching()) {
            <span class="badge badge-primary animate-pulse font-black">WATCHING</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Detect user inactivity or lock states. Only available in secure contexts and supported
        browsers.
      </p>

      <div class="svc-controls mb-8">
        <button
          class="btn btn-primary font-black"
          (click)="start()"
          [disabled]="watching() || !supported"
        >
          Start Detection
        </button>
        <button class="btn btn-danger font-black" (click)="stop()" [disabled]="!watching()">
          Stop
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div class="svc-result flex flex-col items-center justify-center py-10">
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-4"
            >User Status</span
          >
          <span
            class="text-3xl font-black tracking-tighter"
            [class.text-success]="userState() === 'active'"
            [class.text-warning]="userState() === 'idle'"
          >
            {{ userState() || 'UNKNOWN' | uppercase }}
          </span>
          <div class="mt-6 flex gap-2">
            <span
              class="w-2 h-2 rounded-full"
              [class.bg-success]="userState() === 'active'"
              [class.bg-warning]="userState() === 'idle'"
            ></span>
            <span class="w-2 h-2 rounded-full opacity-20 bg-white"></span>
            <span class="w-2 h-2 rounded-full opacity-20 bg-white"></span>
          </div>
        </div>

        <div class="svc-result flex flex-col items-center justify-center py-10">
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-4"
            >Screen Status</span
          >
          <span
            class="text-3xl font-black tracking-tighter"
            [class.text-success]="screenState() === 'unlocked'"
            [class.text-error]="screenState() === 'locked'"
          >
            {{ screenState() || 'UNKNOWN' | uppercase }}
          </span>
          <div class="mt-6 flex gap-2">
            <span
              class="w-2 h-2 rounded-full"
              [class.bg-success]="screenState() === 'unlocked'"
              [class.bg-error]="screenState() === 'locked'"
            ></span>
            <span class="w-2 h-2 rounded-full opacity-20 bg-white"></span>
            <span class="w-2 h-2 rounded-full opacity-20 bg-white"></span>
          </div>
        </div>
      </div>

      @if (!supported) {
        <div class="feedback feedback-info mt-8">
          <span class="text-2xl">ℹ️</span>
          <span>IdleDetector requires a secure context and Chromium 94+.</span>
        </div>
      }
    </section>
  `,
})
export class IdleDetectorDemoComponent implements OnDestroy {
  private readonly svc = inject(IdleDetectorService);
  private sub: Subscription | null = null;

  readonly supported = this.svc.isSupported();
  readonly watching = signal(false);
  readonly userState = signal<string | null>(null);
  readonly screenState = signal<string | null>(null);

  async start(): Promise<void> {
    try {
      await this.svc.requestPermission();
      this.sub = this.svc.watch({ threshold: 60000 }).subscribe((state) => {
        this.userState.set(state.userState);
        this.screenState.set(state.screenState);
      });
      this.watching.set(true);
    } catch {
      // failed or denied
    }
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.watching.set(false);
    this.userState.set(null);
    this.screenState.set(null);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
