import { flushEffects } from './signal-testing';
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
});
