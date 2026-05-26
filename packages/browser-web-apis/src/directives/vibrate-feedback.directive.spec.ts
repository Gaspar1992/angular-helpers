import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { VibrateFeedbackDirective } from './vibrate-feedback.directive';
import { VibrationService } from '../services/vibration.service';

const mockVibrate = vi.fn();
class MockVibrationService {
  isSupported = vi.fn().mockReturnValue(true);
  vibrate = mockVibrate;
  success = vi.fn();
  error = vi.fn();
  notification = vi.fn();
  doubleTap = vi.fn();
}

@Component({
  standalone: true,
  imports: [VibrateFeedbackDirective],
  template: `<button vibrateFeedback="success">Success</button>`,
})
class TestVibrateComponent {}

describe('VibrateFeedbackDirective', () => {
  let fixture: ComponentFixture<TestVibrateComponent>;
  let button: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestVibrateComponent],
      providers: [{ provide: VibrationService, useClass: MockVibrationService }],
    });
    fixture = TestBed.createComponent(TestVibrateComponent);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  it('should create and trigger vibration click binding', () => {
    expect(button).toBeTruthy();
    button.click();
    // Verify custom service call (mocked injection handles success vibration preset trigger)
    const serviceInstance = TestBed.inject(VibrationService);
    expect(serviceInstance.success).toHaveBeenCalled();
  });
});
