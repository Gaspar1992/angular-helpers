import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { VitalsPanelComponent } from './vitals-panel.component';

import type { PerformanceObserverRef } from '@angular-helpers/browser-web-apis';

vi.mock('@angular-helpers/browser-web-apis', () => ({
  injectPerformanceObserver: vi.fn(),
}));

import { injectPerformanceObserver } from '@angular-helpers/browser-web-apis';

const mockInject = vi.mocked(injectPerformanceObserver);

function createMockRef(
  entries: PerformanceEntryList = [],
): PerformanceObserverRef & { _entries: WritableSignal<PerformanceEntryList> } {
  const entriesSignal = signal<PerformanceEntryList>(entries);
  return {
    _entries: entriesSignal,
    entries: entriesSignal.asReadonly(),
    entryCount: signal(entries.length).asReadonly(),
    latestEntry: signal(entries[entries.length - 1] as PerformanceEntry | undefined).asReadonly(),
  };
}

describe('VitalsPanelComponent', () => {
  let fixture: ComponentFixture<VitalsPanelComponent>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setup(): ComponentFixture<VitalsPanelComponent> {
    TestBed.configureTestingModule({
      imports: [VitalsPanelComponent],
    });
    fixture = TestBed.createComponent(VitalsPanelComponent);
    fixture.detectChanges();
    return fixture;
  }

  function expandPanel(): void {
    const toggleBtn = fixture.nativeElement.querySelector(
      'button[aria-controls="vitals-panel-content"]',
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();
  }

  // ---------- Scenario 1: LCP ----------

  describe('LCP (Scenario 1)', () => {
    it('should display LCP value when a largest-contentful-paint entry is observed with startTime 1200', () => {
      const lcpRef = createMockRef([{ startTime: 1200 } as PerformanceEntry]);
      const clsRef = createMockRef();
      const inpRef = createMockRef();

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('1.20');
    });

    it('should display updated LCP when entry has startTime 2500', () => {
      const lcpRef = createMockRef([{ startTime: 2500 } as PerformanceEntry]);
      const clsRef = createMockRef();
      const inpRef = createMockRef();

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('2.50');
    });
  });

  // ---------- Scenario 2: CLS Session Window ----------

  describe('CLS Session Window (Scenario 2)', () => {
    it('should compute CLS of 0.10 from two valid shifts excluding hadRecentInput entry', () => {
      const lcpRef = createMockRef();
      const clsRef = createMockRef([
        { startTime: 1000, value: 0.05, hadRecentInput: false } as unknown as PerformanceEntry,
        { startTime: 1500, value: 0.05, hadRecentInput: false } as unknown as PerformanceEntry,
        { startTime: 3000, value: 0.1, hadRecentInput: true } as unknown as PerformanceEntry,
      ]);
      const inpRef = createMockRef();

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('0.10');
    });

    it('should compute CLS of 0.00 when all shifts have hadRecentInput', () => {
      const lcpRef = createMockRef();
      const clsRef = createMockRef([
        { startTime: 1000, value: 0.1, hadRecentInput: true } as unknown as PerformanceEntry,
      ]);
      const inpRef = createMockRef();

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('0.00');
    });
  });

  // ---------- Scenario 3: INP ----------

  describe('INP (Scenario 3)', () => {
    it('should display INP of 150ms from event entries with interactionId > 0', () => {
      const lcpRef = createMockRef();
      const clsRef = createMockRef();
      const inpRef = createMockRef([
        { duration: 80, interactionId: 100 } as unknown as PerformanceEntry,
        { duration: 150, interactionId: 101 } as unknown as PerformanceEntry,
      ]);

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('150');
    });

    it('should not count entries with interactionId 0 for INP', () => {
      const lcpRef = createMockRef();
      const clsRef = createMockRef();
      const inpRef = createMockRef([
        { duration: 200, interactionId: 0 } as unknown as PerformanceEntry,
        { duration: 50, interactionId: 42 } as unknown as PerformanceEntry,
      ]);

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('50');
      // Should NOT contain 200 as that entry has interactionId 0
    });
  });

  // ---------- Scenario 4: N/A Fallback ----------

  describe('N/A Fallback (Scenario 4)', () => {
    it('should display N/A for all metrics when observers return empty entries (unsupported)', () => {
      const lcpRef = createMockRef();
      const clsRef = createMockRef();
      const inpRef = createMockRef();

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      const naMatches = el.textContent!.match(/N\/A/g);
      expect(naMatches).toBeTruthy();
      expect(naMatches!.length).toBe(3);
    });

    it('should display N/A only for INP when LCP and CLS have data but INP does not', () => {
      const lcpRef = createMockRef([{ startTime: 800 } as PerformanceEntry]);
      const clsRef = createMockRef([
        { startTime: 100, value: 0.01, hadRecentInput: false } as unknown as PerformanceEntry,
      ]);
      const inpRef = createMockRef();

      mockInject
        .mockReturnValueOnce(lcpRef)
        .mockReturnValueOnce(clsRef)
        .mockReturnValueOnce(inpRef);

      setup();
      expandPanel();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('0.80');
      expect(el.textContent).toContain('0.01');
      const naMatches = el.textContent!.match(/N\/A/g);
      expect(naMatches).toBeTruthy();
      expect(naMatches!.length).toBe(1);
    });
  });

  // ---------- Scenario 5: Toggle Accessibility ----------

  describe('Toggle Accessibility (Scenario 5)', () => {
    it('should have aria-expanded false when collapsed', () => {
      mockInject.mockReturnValue(createMockRef());
      setup();

      const toggleBtn = fixture.nativeElement.querySelector(
        'button[aria-controls="vitals-panel-content"]',
      );
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    });

    it('should flip aria-expanded to true when toggle button is clicked', () => {
      mockInject.mockReturnValue(createMockRef());
      setup();

      const toggleBtn = fixture.nativeElement.querySelector(
        'button[aria-controls="vitals-panel-content"]',
      );
      toggleBtn.click();
      fixture.detectChanges();

      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    });

    it('should flip aria-expanded back to false on a second click', () => {
      mockInject.mockReturnValue(createMockRef());
      setup();

      const toggleBtn = fixture.nativeElement.querySelector(
        'button[aria-controls="vitals-panel-content"]',
      );
      toggleBtn.click();
      fixture.detectChanges();
      toggleBtn.click();
      fixture.detectChanges();

      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
