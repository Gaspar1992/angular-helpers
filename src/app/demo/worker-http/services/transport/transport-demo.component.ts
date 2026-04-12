import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { DemoCardComponent } from '../../../../ui/demo-card/demo-card.component';

@Component({
  selector: 'app-transport-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [DemoCardComponent],
  styleUrl: '../../../shared/demo-shared.styles.css',
  template: `
    <app-demo-card
      title="Worker Transport"
      description="Typed RPC bridge with request/response correlation, cancellation on unsubscribe, and worker pool."
      badge="Transport"
      badgeVariant="default"
    >
      <div class="demo-buttons">
        <button (click)="sendEcho()" class="btn btn-primary">Send Echo</button>
        <button (click)="poolBurst()" class="btn btn-secondary">Pool Burst (8 req / 4 workers)</button>
      </div>
      @if (transportResult()) {
        <div class="demo-output">{{ transportResult() }}</div>
      }
    </app-demo-card>
  `,
})
export class TransportDemoComponent {
  transportResult = signal<string>('');

  sendEcho(): void {
    this.transportResult.set('Echo request sent...');
    // Implementation would use WorkerHttpService
  }

  poolBurst(): void {
    this.transportResult.set('Pool burst started with 8 requests...');
    // Implementation would use WorkerHttpService with pool
  }
}
