import { flushEffects, createMockSignal, withFlushedEffects } from './signal-testing';
import { TestBed } from '@angular/core/testing';
import { Component, effect, signal } from '@angular/core';

@Component({
  selector: 'app-effect-test',
  template: '',
})
class EffectComponent {
  val = signal(1);
  effectRunCount = 0;

  constructor() {
    effect(() => {
      this.val();
      this.effectRunCount++;
    });
  }
}

describe('flushEffects', () => {
  it('should flush pending effects synchronously', () => {
    TestBed.configureTestingModule({ imports: [EffectComponent] });
    const fixture = TestBed.createComponent(EffectComponent);

    fixture.detectChanges();
    expect(fixture.componentInstance.effectRunCount).toBe(1);

    fixture.componentInstance.val.set(2);
    // Microtask not run yet
    expect(fixture.componentInstance.effectRunCount).toBe(1);

    flushEffects();
    expect(fixture.componentInstance.effectRunCount).toBe(2);
  });

  it('should create mock signal and update effects using withFlushedEffects', () => {
    TestBed.configureTestingModule({ imports: [EffectComponent] });
    const fixture = TestBed.createComponent(EffectComponent);
    const mockSig = createMockSignal(10);
    expect(mockSig()).toBe(10);

    fixture.detectChanges();
    withFlushedEffects(() => {
      fixture.componentInstance.val.set(99);
    });
    expect(fixture.componentInstance.effectRunCount).toBe(2);
  });
});
