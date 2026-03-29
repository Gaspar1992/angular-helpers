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
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="geo-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="geo-title">Geolocation</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge badge-secure">secure context</span>
        </div>
      </div>
      <div class="svc-controls">
        <button class="btn btn-primary" (click)="getLocation()" [disabled]="loading()">
          Get location
        </button>
        <button class="btn btn-secondary" (click)="watchLocation()" [disabled]="watchId() !== null">
          Watch
        </button>
        <button class="btn btn-danger" (click)="stopWatch()" [disabled]="watchId() === null">
          Stop watch
        </button>
      </div>
      @if (position(); as pos) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">Latitude</span>
            <span class="kv-val mono">{{ pos.coords.latitude.toFixed(6) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Longitude</span>
            <span class="kv-val mono">{{ pos.coords.longitude.toFixed(6) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Accuracy</span>
            <span class="kv-val mono">±{{ pos.coords.accuracy.toFixed(0) }} m</span>
          </div>
          @if (pos.coords.altitude) {
            <div class="kv-row">
              <span class="kv-key">Altitude</span>
              <span class="kv-val mono">{{ pos.coords.altitude.toFixed(2) }} m</span>
            </div>
          }
          <div class="kv-row">
            <span class="kv-key">Timestamp</span>
            <span class="kv-val mono">{{ formatDate(pos.timestamp) }}</span>
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
