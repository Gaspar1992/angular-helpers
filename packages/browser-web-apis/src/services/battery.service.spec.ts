import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BatteryService } from './battery.service';
import { firstValueFrom } from 'rxjs';

// Mock dependencies
vi.mock('../utils/ssr-safe.util', () => ({
    getNavigator: vi.fn(() => ({
      getBattery: vi.fn()
    }))
  }
}));

describe('BatteryService', () => {
  let service: BatteryService;
  let mockBattery: any;
  let mockNavigator: any;

  beforeEach(() => {
    mockBattery = {
      level: 0.75,
      charging: true,
      chargingTime: 3600,
      dischargingTime: Infinity,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    mockNavigator = {
      getBattery: vi.fn().mockResolvedValue(mockBattery)
    };

    service = TestBed.inject(BatteryService);
  });

  describe('ensureInitialized', () => {
    it('should initialize battery service successfully', async () => {
      await service.ensureInitialized();

      expect(mockNavigator.getBattery).toHaveBeenCalled();
      expect(service.getBatteryInfoSignal().level).toBe(0.75);
      expect(service.getBatteryInfoSignal().charging).toBe(true);
      expect(service.getBatteryInfoSignal().chargingTime).toBe(3600);
      expect(service.getBatteryInfoSignal().dischargingTime).toBe(Infinity);
    });

    it('should handle initialization error', async () => {
      const error = new Error('Battery API not available');
      mockNavigator.getBattery.mockRejectedValue(error);

      await service.ensureInitialized();

      // Should not throw, just log warning
      expect(service.getBatteryInfoSignal().level).toBe(1); // Default value
    });

    it('should not initialize in server environment', async () => {

    it('should not initialize twice', async () => {
      await service.ensureInitialized();
      await service.ensureInitialized(); // Second call

      expect(mockNavigator.getBattery).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBatteryInfo', () => {
    it('should get battery information as observable', async () => {
      await service.ensureInitialized();

      const batteryInfo = await firstValueFrom(service.getBatteryInfo());

      expect(batteryInfo).toEqual({
        level: 0.75,
        charging: true,
        chargingTime: 3600,
        dischargingTime: Infinity
      });
    });

    it('should filter invalid battery info', async () => {
      // Don't initialize, so level will be -1 (invalid)
      const batteryInfoPromise = firstValueFrom(service.getBatteryInfo());
      
      // Should never resolve due to filter
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      );
      
      await expect(Promise.race([batteryInfoPromise, timeout])).rejects.toThrow('Timeout');
    });
  });

  describe('getChargingState', () => {
    it('should get charging state as observable', async () => {
      await service.ensureInitialized();

      const chargingState = await firstValueFrom(service.getChargingState());

      expect(chargingState).toBe(true);
    });
  });

  describe('getBatteryLevel', () => {
    it('should get battery level as observable', async () => {
      await service.ensureInitialized();

      const batteryLevel = await firstValueFrom(service.getBatteryLevel());

      expect(batteryLevel).toBe(0.75);
    });
  });

  describe('isSupported', () => {
    it('should return true when battery API is available', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when getBattery is not available', () => {

    it('should return false when navigator is not available', () => {

    it('should return false in server environment', () => {
  });

  describe('signals', () => {
    it('should expose readonly signal for battery info', () => {
      expect(service.getBatteryInfoSignal).toBeDefined();
    });

    it('should update signal when battery info changes', async () => {
      await service.ensureInitialized();

      expect(service.getBatteryInfoSignal().level).toBe(0.75);

      // Simulate battery level change
      mockBattery.level = 0.5;
      
      // Trigger event listeners (simulate levelchange event)
      const levelchangeCallback = mockBattery.addEventListener.mock.calls
        .find((call: any) => call[0] === 'levelchange')?.[1];
      
      if (levelchangeCallback) {
        levelchangeCallback();
      }

      // Signal should be updated
      expect(service.getBatteryInfoSignal().level).toBe(0.5);
    });
  });

  describe('event handling', () => {
    it('should setup event listeners on initialization', async () => {
      await service.ensureInitialized();

      expect(mockBattery.addEventListener).toHaveBeenCalledWith('chargingchange', expect.any(Function));
      expect(mockBattery.addEventListener).toHaveBeenCalledWith('levelchange', expect.any(Function));
      expect(mockBattery.addEventListener).toHaveBeenCalledWith('chargingtimechange', expect.any(Function));
      expect(mockBattery.addEventListener).toHaveBeenCalledWith('dischargingtimechange', expect.any(Function));
    });

    it('should update battery info on charging change', async () => {
      await service.ensureInitialized();

      // Simulate charging change
      mockBattery.charging = false;
      
      const chargingchangeCallback = mockBattery.addEventListener.mock.calls
        .find((call: any) => call[0] === 'chargingchange')?.[1];
      
      if (chargingchangeCallback) {
        chargingchangeCallback();
      }

      expect(service.getBatteryInfoSignal().charging).toBe(false);
    });

    it('should update battery info on charging time change', async () => {
      await service.ensureInitialized();

      // Simulate charging time change
      mockBattery.chargingTime = 1800;
      
      const chargingtimechangeCallback = mockBattery.addEventListener.mock.calls
        .find((call: any) => call[0] === 'chargingtimechange')?.[1];
      
      if (chargingtimechangeCallback) {
        chargingtimechangeCallback();
      }

      expect(service.getBatteryInfoSignal().chargingTime).toBe(1800);
    });

    it('should update battery info on discharging time change', async () => {
      await service.ensureInitialized();

      // Simulate discharging time change
      mockBattery.dischargingTime = 7200;
      
      const dischargingtimechangeCallback = mockBattery.addEventListener.mock.calls
        .find((call: any) => call[0] === 'dischargingtimechange')?.[1];
      
      if (dischargingtimechangeCallback) {
        dischargingtimechangeCallback();
      }

      expect(service.getBatteryInfoSignal().dischargingTime).toBe(7200);
    });
  });

  describe('error handling', () => {
    it('should handle navigator not available', async () => {

    it('should handle getBattery rejection', async () => {
      const error = new Error('Permission denied');
      mockNavigator.getBattery.mockRejectedValue(error);

      await service.ensureInitialized();

      expect(service.getBatteryInfoSignal().level).toBe(1); // Default value
    });

    it('should handle missing battery instance', async () => {
      mockNavigator.getBattery.mockResolvedValue(null);

      await service.ensureInitialized();

      expect(service.getBatteryInfoSignal().level).toBe(1); // Default value
    });
  });

  describe('browser compatibility', () => {
    it('should work with different battery API implementations', async () => {
      // Test with minimal battery API
      const minimalBattery = {
        level: 0.5,
        charging: false,
        chargingTime: 0,
        dischargingTime: Infinity,
        addEventListener: vi.fn()
      };

      mockNavigator.getBattery.mockResolvedValue(minimalBattery);

      await service.ensureInitialized();

      expect(service.getBatteryInfoSignal().level).toBe(0.5);
      expect(service.getBatteryInfoSignal().charging).toBe(false);
    });

    it('should handle incomplete battery data', async () => {
      // Test with incomplete battery data
      const incompleteBattery = {
        level: 0.8,
        // missing other properties
        addEventListener: vi.fn()
      };

      mockNavigator.getBattery.mockResolvedValue(incompleteBattery);

      await service.ensureInitialized();

      expect(service.getBatteryInfoSignal().level).toBe(0.8);
      expect(service.getBatteryInfoSignal().charging).toBe(false); // Default
    });
  });

  describe('observable behavior', () => {
    it('should emit multiple battery updates', async () => {
      await service.ensureInitialized();

      const values: any[] = [];
      const subscription = service.getBatteryInfo().subscribe(value => values.push(value));

      // Simulate multiple changes
      mockBattery.level = 0.6;
      const levelchangeCallback = mockBattery.addEventListener.mock.calls
        .find((call: any) => call[0] === 'levelchange')?.[1];
      if (levelchangeCallback) levelchangeCallback();

      mockBattery.charging = false;
      const chargingchangeCallback = mockBattery.addEventListener.mock.calls
        .find((call: any) => call[0] === 'chargingchange')?.[1];
      if (chargingchangeCallback) chargingchangeCallback();

      // Wait for async updates
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(values.length).toBeGreaterThan(0);
      expect(values[values.length - 1].level).toBe(0.6);
      expect(values[values.length - 1].charging).toBe(false);

      subscription.unsubscribe();
    });
  });
});
