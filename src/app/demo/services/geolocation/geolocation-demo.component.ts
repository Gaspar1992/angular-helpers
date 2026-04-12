import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-geolocation-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="geo-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="geo-title">
          Geolocation
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button class="btn btn-primary btn-sm" (click)="getLocation()" [disabled]="loading()">
          Get location
        </button>
        <button
          class="btn btn-secondary btn-sm"
          (click)="watchLocation()"
          [disabled]="watchId() !== null"
        >
          Watch
        </button>
        <button class="btn btn-error btn-sm" (click)="stopWatch()" [disabled]="watchId() === null">
          Stop watch
        </button>
      </div>
      @if (position(); as pos) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Latitude</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              pos.coords.latitude.toFixed(6)
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Longitude</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              pos.coords.longitude.toFixed(6)
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Accuracy</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >±{{ pos.coords.accuracy.toFixed(0) }} m</span
            >
          </div>
          @if (pos.coords.altitude) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">Altitude</span>
              <span class="text-sm text-base-content font-semibold font-mono"
                >{{ pos.coords.altitude.toFixed(2) }} m</span
              >
            </div>
          }
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Timestamp</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              formatDate(pos.timestamp)
            }}</span>
          </div>
        </div>
      }
    </section>
  `,
})
export class GeolocationDemoComponent implements OnDestroy {
  readonly supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  readonly loading = signal(false);
  readonly position = signal<GeolocationPosition | null>(null);
  readonly watchId = signal<number | null>(null);

  async getLocation(): Promise<void> {
    if (!this.supported) return;
    this.loading.set(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000,
        }),
      );
      this.position.set(pos);
    } finally {
      this.loading.set(false);
    }
  }

  watchLocation(): void {
    if (!this.supported) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => this.position.set(pos),
      () => undefined,
    );
    this.watchId.set(id);
  }

  stopWatch(): void {
    const id = this.watchId();
    if (id !== null) {
      navigator.geolocation.clearWatch(id);
      this.watchId.set(null);
    }
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString();
  }

  ngOnDestroy(): void {
    this.stopWatch();
  }
}
