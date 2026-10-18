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
      template: `
        <button id="light" vibrateFeedback="light">Light</button>
        <button id="success" vibrateFeedback="success">Success</button>
        <button id="error" vibrateFeedback="error">Error</button>
        <button id="notification" vibrateFeedback="notification">Notification</button>
        <button id="doubleTap" vibrateFeedback="doubleTap">DoubleTap</button>
        <button id="custom" [vibrateFeedback]="[100, 50, 100]">Custom</button>
      `,
      providers: [{ provide: VibrationService, useClass: MockVibrationService }],
    });

    vibrationService = result.fixture.debugElement.injector.get(
      VibrationService,
    ) as unknown as MockVibrationService;
  });

  it('should trigger default light vibration (50ms) on click', () => {
    result.click('#light');
    expect(vibrationService.vibrate).toHaveBeenCalledWith(50);
  });

  it('should trigger preset vibrations (success, error, notification, doubleTap)', () => {
    result.click('#success');
    expect(vibrationService.success).toHaveBeenCalledTimes(1);

    result.click('#error');
    expect(vibrationService.error).toHaveBeenCalledTimes(1);

    result.click('#notification');
    expect(vibrationService.notification).toHaveBeenCalledTimes(1);

    result.click('#doubleTap');
    expect(vibrationService.doubleTap).toHaveBeenCalledTimes(1);
  });

  it('should trigger custom vibration pattern when passed a number or array', () => {
    result.click('#custom');
    expect(vibrationService.vibrate).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('should do nothing when vibration service is not supported', () => {
    vibrationService.isSupported.mockReturnValue(false);
    result.click('#light');
    expect(vibrationService.vibrate).not.toHaveBeenCalled();
  });
});
