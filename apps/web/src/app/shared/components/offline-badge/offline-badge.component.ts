import { Component } from '@angular/core';
import { injectNetworkInformation } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-offline-badge',
  template: `
    @if (!network.online()) {
      <div
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/15 border border-warning/30 text-warning text-xs font-semibold animate-pulse"
        role="status"
        aria-live="polite"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-warning"></span>
        <span>Offline</span>
      </div>
    }
  `,
})
export class OfflineBadgeComponent {
  protected readonly network = injectNetworkInformation();
}
