export interface BatteryInfo {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

export interface BatteryManager extends EventTarget {
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
  readonly level: number;
  
  addEventListener(type: 'chargingchange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'levelchange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'chargingtimechange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'dischargingtimechange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | AddEventListenerOptions): void;
  
  removeEventListener(type: 'chargingchange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: 'levelchange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: 'chargingtimechange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: 'dischargingtimechange', listener: (this: BatteryManager, ev: Event) => void, options?: boolean | EventListenerOptions): void;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}
