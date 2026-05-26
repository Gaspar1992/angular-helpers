import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { VibrateFeedbackDirective } from './vibrate-feedback.directive';
import { VibrationService } from '../services/vibration.service';

class MockVibrationService {
  isSupported = vi.fn().mockReturnValue(true);
  vibrate = vi.fn();
  success = vi.fn();
  error = vi.fn();
  notification = vi.fn();
  doubleTap = vi.fn();
}

describe('VibrateFeedbackDirective', () => {
  let directive: VibrateFeedbackDirective;
  let service: VibrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VibrateFeedbackDirective,
        { provide: VibrationService, useClass: MockVibrationService },
      ],
    });
    directive = TestBed.inject(VibrateFeedbackDirective);
    service = TestBed.inject(VibrationService);
  });

  it('should create and trigger vibration click binding', () => {
    expect(directive).toBeTruthy();
    directive.onClick();
    expect(service.vibrate).toHaveBeenCalledWith(50); // Default light feedback
  });
});
