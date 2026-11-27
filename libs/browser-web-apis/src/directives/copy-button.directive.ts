import { Directive, input, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ClipboardService } from '../services/clipboard.service';
import { LiveAnnouncerService } from '../services/live-announcer.service';

@Directive({
  selector: '[copyButton]',
  host: {
    '(click)': 'onClick()',
  },
})
export class CopyButtonDirective {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly clipboardService = inject(ClipboardService);
  private readonly liveAnnouncer = inject(LiveAnnouncerService);

  readonly copyText = input<string>('');
  readonly copySuccessMessage = input<string>('Copied to clipboard');
  readonly copyErrorMessage = input<string>('Failed to copy to clipboard');

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  async onClick(): Promise<void> {
    const text = this.copyText();
    if (!this.isBrowser || !text) return;

    try {
      await this.clipboardService.writeText(text);
      this.liveAnnouncer.announce(this.copySuccessMessage());
    } catch {
      this.liveAnnouncer.announce(this.copyErrorMessage());
    }
  }
}
