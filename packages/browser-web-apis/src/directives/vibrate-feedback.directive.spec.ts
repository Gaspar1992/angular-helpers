import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VibrateFeedbackDirective } from './vibrate-feedback.directive';
import { VibrationService } from '../services/vibration.service';
import { render, RenderResult } from '@angular-helpers/testing';

class MockVibrationService {
  isSupported = vi.fn().mockReturnValue(true);
  vibrate = vi.fn();
  success = vi.fn();
  error = vi.fn();
  notification = vi.fn();
  doubleTap = vi.fn();
}

describe('VibrateFeedbackDirective', () => {
  let result: RenderResult<any>;
  let vibrationService: MockVibrationService;

  beforeEach(async () => {
    result = await render(VibrateFeedbackDirective, {
      template: '<button vibrateFeedback>Vibrate</button>',
      providers: [{ provide: VibrationService, useClass: MockVibrationService }],
    });

    vibrationService = result.fixture.debugElement.injector.get(
      VibrationService,
    ) as unknown as MockVibrationService;
  });

  it('should create and trigger vibration on click', () => {
    expect(result.fixture.nativeElement.querySelector('button')).toBeTruthy();

    // Simulate DOM click
    result.click('button');

    // Default light feedback is 50ms
    expect(vibrationService.vibrate).toHaveBeenCalledWith(50);
  });
});
