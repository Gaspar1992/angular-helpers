import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { IdleDetectorService } from './idle-detector.service';

describe('IdleDetectorService', () => {
  let service: IdleDetectorService;
  let mockRequestPermission: any;
  let mockStart: any;
  let mockAddEventListener: any;
  let mockRemoveEventListener: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IdleDetectorService],
    });
    service = TestBed.inject(IdleDetectorService);

    mockRequestPermission = vi.fn().mockResolvedValue('granted');
    mockStart = vi.fn().mockResolvedValue(undefined);
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();

    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal(
      'IdleDetector',
      class MockIdleDetector {
        static requestPermission = mockRequestPermission;
        userState = 'idle';
        screenState = 'unlocked';
        start = mockStart;
        addEventListener = mockAddEventListener;
        removeEventListener = mockRemoveEventListener;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report supported when IdleDetector is in window and is secure context', () => {
    expect(service.isSupported()).toBe(true);
  });

  it('should request permission', async () => {
    const result = await service.requestPermission();
    expect(result).toBe('granted');
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should watch state changes', () => {
    const observer = vi.fn();
    const subscription = service.watch({ threshold: 60000 }).subscribe(observer);

    expect(mockStart).toHaveBeenCalledWith(expect.objectContaining({ threshold: 60000 }));
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    // trigger change manually
    const changeHandler = mockAddEventListener.mock.calls[0][1];
    changeHandler();

    expect(observer).toHaveBeenCalledWith({ userState: 'idle', screenState: 'unlocked' });

    subscription.unsubscribe();
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', changeHandler);
  });
});
