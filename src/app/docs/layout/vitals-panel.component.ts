import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { injectPerformanceObserver } from '@angular-helpers/browser-web-apis';

interface LayoutShiftEntry extends PerformanceEntry {
  readonly value: number;
  readonly hadRecentInput: boolean;
}

interface EventTimingEntry extends PerformanceEntry {
  readonly interactionId: number;
}

/**
 * Computes CLS using session windows.
 * Session window rules: gap < 1s between shifts, total duration <= 5s.
 * Excludes entries where hadRecentInput is true.
 */
function computeCls(entries: PerformanceEntryList): number {
  const validEntries = (entries as LayoutShiftEntry[]).filter((e) => !e.hadRecentInput);

  if (validEntries.length === 0) return 0;

  let maxScore = 0;
  let windowScore = 0;
  let windowStart = -1;
  let lastEntryTime = -1;

  for (const entry of validEntries) {
    const entryTime = entry.startTime;

    if (windowStart === -1) {
      windowStart = entryTime;
      windowScore = entry.value;
      lastEntryTime = entryTime;
    } else {
      const gapFromLast = entryTime - lastEntryTime;
      const durationFromStart = entryTime - windowStart;

      if (gapFromLast < 1000 && durationFromStart <= 5000) {
        windowScore += entry.value;
        lastEntryTime = entryTime;
      } else {
        maxScore = Math.max(maxScore, windowScore);
        windowStart = entryTime;
        windowScore = entry.value;
        lastEntryTime = entryTime;
      }
    }
  }

  return Math.max(maxScore, windowScore);
}

/**
 * Computes INP as the maximum duration of event entries with interactionId > 0.
 */
function computeInp(entries: PerformanceEntryList): number | null {
  const interactions = (entries as EventTimingEntry[]).filter((e) => e.interactionId > 0);

  if (interactions.length === 0) return null;

  return Math.max(...interactions.map((e) => e.duration));
}

@Component({
  selector: 'app-vitals-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="toggle()"
      [attr.aria-expanded]="expanded()"
      aria-controls="vitals-panel-content"
      class="vitals-toggle"
    >
      ⚡ Vitals
    </button>

    <div
      id="vitals-panel-content"
      class="vitals-content"
      [class.expanded]="expanded()"
      role="region"
      aria-label="Core Web Vitals"
    >
      <div class="vitals-metric">
        <span class="vitals-label">LCP</span>
        <span class="vitals-value" [class]="lcpStatusClass()">
          @if (lcpMs() !== null) {
            {{ lcpFormatted() }}s
          } @else {
            N/A
          }
        </span>
      </div>
      <div class="vitals-metric">
        <span class="vitals-label">CLS</span>
        <span class="vitals-value" [class]="clsStatusClass()">
          @if (clsScore() !== null) {
            {{ clsFormatted() }}
          } @else {
            N/A
          }
        </span>
      </div>
      <div class="vitals-metric">
        <span class="vitals-label">INP</span>
        <span class="vitals-value" [class]="inpStatusClass()">
          @if (inpMs() !== null) {
            {{ inpMs() }}ms
          } @else {
            N/A
          }
        </span>
      </div>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 9999;
      font-family:
        'Inter',
        system-ui,
        -apple-system,
        sans-serif;
      font-size: 12px;
    }

    .vitals-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #e2e8f0;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .vitals-toggle:hover {
      background: rgba(15, 23, 42, 0.9);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .vitals-content {
      margin-top: 8px;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      min-width: 140px;
      opacity: 0;
      visibility: hidden;
      transform: scale(0.95) translateY(4px);
      transform-origin: bottom right;
      transition:
        opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, opacity;
    }

    .vitals-content.expanded {
      opacity: 1;
      visibility: visible;
      transform: scale(1) translateY(0);
    }

    .vitals-metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .vitals-label {
      color: #94a3b8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 10px;
    }

    .vitals-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: #e2e8f0;
    }

    .vitals-good {
      color: #4ade80;
    }

    .vitals-needs-improvement {
      color: #fbbf24;
    }

    .vitals-poor {
      color: #f87171;
    }
  `,
})
export class VitalsPanelComponent {
  protected readonly expanded = signal(false);

  private readonly lcpObserver = injectPerformanceObserver({
    type: 'largest-contentful-paint',
    buffered: true,
  });

  private readonly clsObserver = injectPerformanceObserver({
    type: 'layout-shift',
    buffered: true,
  });

  private readonly inpObserver = injectPerformanceObserver({
    type: 'event',
    buffered: true,
  });

  /** LCP: latest entry startTime in ms, null if no data */
  readonly lcpMs = computed<number | null>(() => {
    const entries = this.lcpObserver.entries();
    if (entries.length === 0) return null;
    return entries[entries.length - 1].startTime;
  });

  /** LCP formatted as seconds with 2 decimal places */
  readonly lcpFormatted = computed(() => {
    const ms = this.lcpMs();
    if (ms === null) return null;
    return (ms / 1000).toFixed(2);
  });

  /** CLS: max session-window score, null if no valid entries */
  readonly clsScore = computed<number | null>(() => {
    const entries = this.clsObserver.entries();
    if (entries.length === 0) return null;
    return computeCls(entries);
  });

  /** CLS formatted to 2 decimal places */
  readonly clsFormatted = computed(() => {
    const score = this.clsScore();
    if (score === null) return null;
    return score.toFixed(2);
  });

  /** INP: max duration of interactions with interactionId > 0 */
  readonly inpMs = computed<number | null>(() => {
    const entries = this.inpObserver.entries();
    if (entries.length === 0) return null;
    return computeInp(entries);
  });

  /** LCP status thresholds: good <= 2500ms, poor > 4000ms */
  readonly lcpStatusClass = computed(() => {
    const ms = this.lcpMs();
    if (ms === null) return '';
    if (ms <= 2500) return 'vitals-good';
    if (ms <= 4000) return 'vitals-needs-improvement';
    return 'vitals-poor';
  });

  /** CLS status thresholds: good <= 0.1, poor > 0.25 */
  readonly clsStatusClass = computed(() => {
    const score = this.clsScore();
    if (score === null) return '';
    if (score <= 0.1) return 'vitals-good';
    if (score <= 0.25) return 'vitals-needs-improvement';
    return 'vitals-poor';
  });

  /** INP status thresholds: good <= 200ms, poor > 500ms */
  readonly inpStatusClass = computed(() => {
    const ms = this.inpMs();
    if (ms === null) return '';
    if (ms <= 200) return 'vitals-good';
    if (ms <= 500) return 'vitals-needs-improvement';
    return 'vitals-poor';
  });

  protected toggle(): void {
    this.expanded.update((v) => !v);
  }
}
