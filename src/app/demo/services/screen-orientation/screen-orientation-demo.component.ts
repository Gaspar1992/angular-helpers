import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ScreenOrientationService,
  injectScreenOrientation,
  type OrientationType,
} from '@angular-helpers/browser-web-apis';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';

@Component({
  selector: 'app-screen-orientation-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ScreenOrientationService],
  imports: [CodeBlockComponent],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="orient-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="orient-title">
          <span class="text-primary text-2xl">📱</span> Screen Orientation
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge badge-info font-black">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="svc-desc">
        Track device orientation changes and programmatically lock the screen to specific modes.
      </p>

      <div class="svc-controls mb-8">
        <div class="segmented" role="group" aria-label="API mode">
          <button
            class="btn btn-sm font-black"
            [class.active]="apiMode() === 'Service'"
            (click)="setMode('Service')"
          >
            Service
          </button>
          <button
            class="btn btn-sm font-black"
            [class.active]="apiMode() === 'Signal Fn'"
            (click)="setMode('Signal Fn')"
          >
            Signal Fn
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-primary btn-sm font-black"
            (click)="lock('landscape')"
            [disabled]="!supported"
          >
            Lock Landscape
          </button>
          <button
            class="btn btn-primary btn-sm font-black"
            (click)="lock('portrait')"
            [disabled]="!supported"
          >
            Lock Portrait
          </button>
          <button
            class="btn btn-secondary btn-sm font-black"
            (click)="unlock()"
            [disabled]="!supported"
          >
            Unlock
          </button>
        </div>
      </div>

      <div class="svc-result">
        @if (apiMode() === 'Service') {
          <div class="kv-row">
            <span class="kv-key">Orientation Type</span>
            <span class="kv-val text-primary uppercase">{{ orientation() }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Angle</span>
            <span class="kv-val text-secondary">{{ angle() }}°</span>
          </div>
        } @else {
          <div class="kv-row">
            <span class="kv-key">type() signal</span>
            <span class="kv-val text-primary uppercase">{{ fnRef.type() }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">angle() signal</span>
            <span class="kv-val text-secondary">{{ fnRef.angle() }}°</span>
          </div>
        }
      </div>

      <div class="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        @if (apiMode() === 'Signal Fn') {
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Composition API
          </p>
          <app-code-block
            code="import { injectScreenOrientation } from '@angular-helpers/browser-web-apis';

readonly orient = injectScreenOrientation();

// Signals:
// orient.type(), orient.angle()"
          />
        } @else {
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Service Subscription
          </p>
          <app-code-block
            code="import { ScreenOrientationService } from '@angular-helpers/browser-web-apis';

readonly svc = inject(ScreenOrientationService);

this.svc.watch().subscribe(info => {
  const { type, angle } = info;
  // handle change
});"
          />
        }
      </div>
    </section>
  `,
})
export class ScreenOrientationDemoComponent implements OnDestroy {
  private readonly svc = inject(ScreenOrientationService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly orientation = signal<string>('unknown');
  readonly angle = signal<number>(0);
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');

  readonly fnRef = injectScreenOrientation();

  constructor() {
    if (this.supported) {
      const snapshot = this.svc.getSnapshot();
      this.orientation.set(snapshot.type);
      this.angle.set(snapshot.angle);
      this.subs.push(
        this.svc.watch().subscribe((info) => {
          this.orientation.set(info.type);
          this.angle.set(info.angle);
        }),
      );
    }
  }

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  async lock(mode: any): Promise<void> {
    try {
      await this.svc.lock(mode);
    } catch (err) {
      console.error('Lock failed:', err);
    }
  }

  unlock(): void {
    this.svc.unlock();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
