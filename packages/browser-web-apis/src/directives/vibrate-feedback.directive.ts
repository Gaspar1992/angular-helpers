import { Directive, input, inject } from '@angular/core';
import { VibrationService, type VibrationPattern } from '../services/vibration.service';

export type VibrateFeedbackType = 'success' | 'error' | 'notification' | 'doubleTap' | 'light';

@Directive({
  selector: '[vibrateFeedback]',
  standalone: true,
  host: {
    '(click)': 'onClick()',
  },
})
export class VibrateFeedbackDirective {
  private readonly vibrationService = inject(VibrationService);

  readonly vibrateFeedback = input<VibrateFeedbackType | VibrationPattern>('light');

  onClick(): void {
    this.triggerVibration();
  }

  private triggerVibration(): void {
    if (!this.vibrationService.isSupported()) return;

    const feedback = this.vibrateFeedback();
    if (typeof feedback === 'string') {
      switch (feedback) {
        case 'success':
          this.vibrationService.success();
          break;
        case 'error':
          this.vibrationService.error();
          break;
        case 'notification':
          this.vibrationService.notification();
          break;
        case 'doubleTap':
          this.vibrationService.doubleTap();
          break;
        case 'light':
        default:
          this.vibrationService.vibrate(50);
          break;
      }
    } else {
      this.vibrationService.vibrate(feedback);
    }
  }
}
