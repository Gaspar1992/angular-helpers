import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { BatteryManager, BatteryInfo } from '../interfaces/battery.interface';
import { BrowserApiBaseService } from './base/browser-api-base.service';

// Type extension for Battery API
interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

@Injectable()
export class BatteryService extends BrowserApiBaseService {
  private battery = signal<BatteryManager | null>(null);
  private batteryInfo = signal<BatteryInfo>({
    charging: false,
    chargingTime: 0,
    dischargingTime: Infinity,
    level: 1
  });
  private initialized = false;

  constructor() {
    super();
    // No auto-initialization in constructor for SSR safety
  }

  protected override getApiName(): string {
    return 'battery';
  }

  private async initBattery(): Promise<void> {
    if (this.initialized || !this.isBrowserEnvironment()) {
      return;
    }

    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as NavigatorWithBattery).getBattery!();
        this.battery.set(battery);
        this.updateBatteryInfo();
        this.setupEventListeners();
        this.initialized = true;
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  private updateBatteryInfo(): void {
    const battery = this.battery();
    if (battery) {
      this.batteryInfo.set({
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        level: battery.level
      });
    }
  }

  private setupEventListeners(): void {
    const battery = this.battery();
    if (!battery) return;

    const events = ['chargingchange', 'levelchange', 'chargingtimechange', 'dischargingtimechange'];
    
    events.forEach(eventType => {
      fromEvent(battery, eventType).subscribe(() => {
        this.updateBatteryInfo();
      });
    });
  }

  override isSupported(): boolean {
    return this.isBrowserEnvironment() && 'getBattery' in navigator;
  }

  /**
   * Ensure the service is initialized before use
   */
  async ensureInitialized(): Promise<void> {
    await this.initBattery();
  }

  getBatteryInfo(): Observable<BatteryInfo> {
    return toObservable(this.batteryInfo).pipe(
      filter(info => info.level >= 0)
    );
  }

  readonly getBatteryInfoSignal = this.batteryInfo.asReadonly();

  getChargingState(): Observable<boolean> {
    return this.getBatteryInfo().pipe(
      map(info => info.charging)
    );
  }

  getBatteryLevel(): Observable<number> {
    return this.getBatteryInfo().pipe(
      map(info => info.level)
    );
  }

  getTimeUntilFull(): Observable<number> {
    return this.getBatteryInfo().pipe(
      map(info => info.chargingTime === Infinity ? -1 : info.chargingTime)
    );
  }

  getTimeUntilEmpty(): Observable<number> {
    return this.getBatteryInfo().pipe(
      map(info => info.dischargingTime === Infinity ? -1 : info.dischargingTime)
    );
  }

  getBatteryPercentage(): number {
    const info = this.batteryInfo();
    return Math.round(info.level * 100);
  }

  isCharging(): boolean {
    return this.batteryInfo().charging;
  }

  getChargingTime(): number {
    const time = this.batteryInfo().chargingTime;
    return time === Infinity ? -1 : time;
  }

  getDischargingTime(): number {
    const time = this.batteryInfo().dischargingTime;
    return time === Infinity ? -1 : time;
  }

  formatTime(seconds: number): string {
    if (seconds <= 0 || seconds === Infinity) {
      return 'Unknown';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getBatteryStatus(): string {
    const info = this.batteryInfo();
    const percentage = this.getBatteryPercentage();
    
    if (info.charging) {
      const timeToFull = this.getChargingTime();
      return timeToFull > 0 
        ? `Charging (${percentage}%) - ${this.formatTime(timeToFull)} until full`
        : `Charging (${percentage}%)`;
    } else {
      const timeToEmpty = this.getDischargingTime();
      return timeToEmpty > 0
        ? `On battery (${percentage}%) - ${this.formatTime(timeToEmpty)} remaining`
        : `On battery (${percentage}%)`;
    }
  }
}
