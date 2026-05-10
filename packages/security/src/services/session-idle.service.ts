import { Injectable, Signal, signal, NgZone, inject, Injector, DestroyRef } from '@angular/core';
import { Observable, Subject, fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { SecureStorageService } from './secure-storage.service';
import { SensitiveClipboardService } from './sensitive-clipboard.service';

export interface SessionIdleConfig {
  timeoutMs: number;
  warningThresholdMs?: number;
  autoClearStorage?: boolean;
  autoClearClipboard?: boolean;
  events?: string[];
}

const DEFAULT_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

@Injectable({
  providedIn: 'root',
})
export class SessionIdleService {
  private ngZone = inject(NgZone);
  private document = inject(DOCUMENT);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  private _isIdle = signal(false);
  private _isWarning = signal(false);
  private _timeRemaining = signal<number | null>(null);
  private _timeoutSubject = new Subject<void>();

  readonly isIdle: Signal<boolean> = this._isIdle.asReadonly();
  readonly isWarning: Signal<boolean> = this._isWarning.asReadonly();
  readonly timeRemaining: Signal<number | null> = this._timeRemaining.asReadonly();
  readonly onTimeout: Observable<void> = this._timeoutSubject.asObservable();

  private config: SessionIdleConfig | null = null;
  private lastActivityTime = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private eventSubscription?: Subscription;

  constructor() {
    this.destroyRef.onDestroy(() => this.stop());
  }

  start(config: SessionIdleConfig): void {
    this.stop();
    this.config = config;
    this._isIdle.set(false);
    this._isWarning.set(false);
    this._timeRemaining.set(config.timeoutMs);
    this.lastActivityTime = Date.now();

    const eventsToTrack = config.events || DEFAULT_EVENTS;

    this.ngZone.runOutsideAngular(() => {
      const observables = eventsToTrack.map((ev) => fromEvent(this.document, ev));
      this.eventSubscription = merge(...observables)
        .pipe(throttleTime(500))
        .subscribe(() => {
          this.lastActivityTime = Date.now();
        });

      this.timerInterval = setInterval(() => this.checkIdle(), 1000);
    });
  }

  stop(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
      this.eventSubscription = undefined;
    }
    this.config = null;
    this._timeRemaining.set(null);
    this._isIdle.set(false);
    this._isWarning.set(false);
  }

  reset(): void {
    if (!this.config) return;
    this.lastActivityTime = Date.now();
    this._timeRemaining.set(this.config.timeoutMs);
    this._isIdle.set(false);
    this._isWarning.set(false);
  }

  private checkIdle(): void {
    if (!this.config || this._isIdle()) return;

    const elapsed = Date.now() - this.lastActivityTime;
    const remaining = Math.max(0, this.config.timeoutMs - elapsed);

    if (remaining === 0) {
      this.triggerTimeout();
    } else {
      const warningThreshold = this.config.warningThresholdMs || 0;
      const shouldBeWarning = remaining <= warningThreshold;

      this.ngZone.run(() => {
        this._timeRemaining.set(remaining);
        if (this._isWarning() !== shouldBeWarning) {
          this._isWarning.set(shouldBeWarning);
        }
      });
    }
  }

  private triggerTimeout(): void {
    const config = this.config;
    this.stop();
    // Restore config temporarily to check for autoClear flags
    this.config = config;

    this.ngZone.run(() => {
      this._timeRemaining.set(0);
      this._isIdle.set(true);
      this._timeoutSubject.next();

      if (this.config?.autoClearStorage) {
        const storage = this.injector.get(SecureStorageService, null);
        if (storage) storage.clear();
      }

      if (this.config?.autoClearClipboard) {
        const clipboard = this.injector.get(SensitiveClipboardService, null);
        if (clipboard) clipboard.clear();
      }

      this.config = null;
    });
  }
}
