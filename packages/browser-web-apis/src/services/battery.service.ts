import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

// Battery API is not standardized in TypeScript, so we need these interfaces
interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface BatteryInfo {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

@Injectable()
export class BatteryService extends BrowserApiBaseService {
  private batteryManager: BatteryManager | null = null;

  protected override getApiName(): string {
    return 'battery';
  }

  private ensureBatterySupport(): void {
    const nav = navigator as NavigatorWithBattery;
    if (!('getBattery' in nav)) {
      throw new Error('Battery API not supported in this browser');
    }
  }

  async initialize(): Promise<BatteryInfo> {
    this.ensureBatterySupport();

    try {
      const nav = navigator as NavigatorWithBattery;
      this.batteryManager = await nav.getBattery!();

      const batteryInfo = this.getBatteryInfo();
      this.setupEventListeners();

      return batteryInfo;
    } catch (error) {
      console.error('[BatteryService] Error initializing battery API:', error);
      throw this.createError('Failed to initialize battery API', error);
    }
  }

  getBatteryInfo(): BatteryInfo {
    if (!this.batteryManager) {
      throw new Error('Battery service not initialized. Call initialize() first.');
    }

    return {
      charging: this.batteryManager.charging,
      chargingTime: this.batteryManager.chargingTime,
      dischargingTime: this.batteryManager.dischargingTime,
      level: this.batteryManager.level,
    };
  }

  watchBatteryInfo(): Observable<BatteryInfo> {
    if (!this.batteryManager) {
      throw new Error('Battery service not initialized. Call initialize() first.');
    }

    return new Observable<BatteryInfo>((observer) => {
      const updateBatteryInfo = () => {
        observer.next(this.getBatteryInfo());
      };

      // Listen to all battery events
      this.batteryManager!.addEventListener('chargingchange', updateBatteryInfo);
      this.batteryManager!.addEventListener('levelchange', updateBatteryInfo);
      this.batteryManager!.addEventListener('chargingtimechange', updateBatteryInfo);
      this.batteryManager!.addEventListener('dischargingtimechange', updateBatteryInfo);

      // Send initial value
      updateBatteryInfo();

      return () => {
        // Cleanup event listeners
        this.batteryManager!.removeEventListener('chargingchange', updateBatteryInfo);
        this.batteryManager!.removeEventListener('levelchange', updateBatteryInfo);
        this.batteryManager!.removeEventListener('chargingtimechange', updateBatteryInfo);
        this.batteryManager!.removeEventListener('dischargingtimechange', updateBatteryInfo);
      };
    });
  }

  private setupEventListeners(): void {
    if (!this.batteryManager) return;

    this.batteryManager.addEventListener('chargingchange', () => {
      console.log('[BatteryService] Charging status changed:', this.batteryManager!.charging);
    });

    this.batteryManager.addEventListener('levelchange', () => {
      console.log('[BatteryService] Battery level changed:', this.batteryManager!.level);
    });
  }

  // Direct access to native battery API
  getNativeBatteryManager(): BatteryManager {
    if (!this.batteryManager) {
      throw new Error('Battery service not initialized. Call initialize() first.');
    }
    return this.batteryManager;
  }

  isCharging(): boolean {
    return this.getBatteryInfo().charging;
  }

  getLevel(): number {
    return this.getBatteryInfo().level;
  }

  getChargingTime(): number {
    return this.getBatteryInfo().chargingTime;
  }

  getDischargingTime(): number {
    return this.getBatteryInfo().dischargingTime;
  }
}
