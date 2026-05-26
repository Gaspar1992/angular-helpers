import { Directive, Input, HostListener, inject } from '@angular/core';
import { VibrationService, type VibrationPattern } from '../services/vibration.service';

export type VibrateFeedbackType = 'success' | 'error' | 'notification' | 'doubleTap' | 'light';

@Directive({
  selector: '[vibrateFeedback]',
  standalone: true,
})
export class VibrateFeedbackDirective {
  private readonly vibrationService =
    inject(VibrationService, { optional: true }) || new VibrationService();

  @Input('vibrateFeedback') feedbackType: VibrateFeedbackType | VibrationPattern = 'light';

  @HostListener('click')
  onClick(): void {
    this.triggerVibration();
  }

  private triggerVibration(): void {
    if (!this.vibrationService.isSupported()) return;

    if (typeof this.feedbackType === 'string') {
      switch (this.feedbackType) {
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
      this.vibrationService.vibrate(this.feedbackType);
    }
  }
}
