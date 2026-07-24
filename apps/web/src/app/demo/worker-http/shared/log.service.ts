import { Injectable, signal } from '@angular/core';
import type { LogEntry } from './models';

/**
 * Shared log channel for every demo card. Each card writes through `log()`,
 * the orchestrator component reads `logs()` to render the activity panel.
 *
 * Scoped at the worker-http demo root (provided by `WorkerHttpDemoComponent`)
 * so the log panel resets between navigations.
 */
@Injectable()
export class WorkerHttpDemoLogService {
  readonly logs = signal<readonly LogEntry[]>([]);
  private counter = 0;

  log(section: string, message: string, type: LogEntry['type'] = 'info'): void {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      fractionalSecondDigits: 3,
    });
    const id = this.counter++;
    this.logs.update((prev) => [{ id, time, section, message, type }, ...prev]);
  }

  clear(): void {
    this.logs.set([]);
  }
}
