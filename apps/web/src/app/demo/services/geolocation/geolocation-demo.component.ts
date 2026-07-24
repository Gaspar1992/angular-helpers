import { Component, type OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-geolocation-demo',
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="geo-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="geo-title">
          <span class="text-primary text-2xl">📍</span> Geolocation
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge badge-info font-black">secure context</span>
        </div>
      </div>
      <p class="svc-desc">Get the current location of the device with high precision.</p>

      <div class="svc-controls">
        <button class="btn btn-primary font-black" (click)="getLocation()" [disabled]="loading()">
          Get location
        </button>
        <button
          class="btn btn-secondary font-black"
          (click)="watchLocation()"
          [disabled]="watchId() !== null"
        >
          Watch
        </button>
        <button
          class="btn btn-danger font-black"
          (click)="stopWatch()"
          [disabled]="watchId() === null"
        >
          Stop watch
        </button>
      </div>

      @if (position(); as pos) {
        <div class="svc-result animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div class="kv-row">
            <span class="kv-key">Latitude</span>
            <span class="kv-val text-primary">{{ pos.coords.latitude.toFixed(6) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Longitude</span>
            <span class="kv-val text-secondary">{{ pos.coords.longitude.toFixed(6) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Accuracy</span>
            <span class="kv-val">±{{ pos.coords.accuracy.toFixed(0) }} m</span>
          </div>
          @if (pos.coords.altitude) {
            <div class="kv-row">
              <span class="kv-key">Altitude</span>
              <span class="kv-val">{{ pos.coords.altitude.toFixed(2) }} m</span>
            </div>
          }
          <div class="kv-row">
            <span class="kv-key">Timestamp</span>
            <span class="kv-val text-base-content/50">{{ formatDate(pos.timestamp) }}</span>
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
