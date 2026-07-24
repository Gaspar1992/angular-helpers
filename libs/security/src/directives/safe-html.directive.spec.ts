import { Component, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { SafeHtmlDirective } from './safe-html.directive';
import { InputSanitizerService } from '../services/input-sanitizer.service';

@Component({
  template: `<div [safeHtml]="htmlValue()"></div>`,
  imports: [SafeHtmlDirective],
})
class TestComponent {
  readonly htmlValue = signal<string | null>(null);
}

describe('SafeHtmlDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;
  let sanitizer: InputSanitizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [InputSanitizerService],
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement.querySelector('div');
    sanitizer = TestBed.inject(InputSanitizerService);

    fixture.detectChanges();
  });

  it('should render empty string when htmlValue is null', () => {
    component.htmlValue.set(null);
    fixture.detectChanges();
    expect(element.innerHTML).toBe('');
  });

  it('should render sanitized HTML', () => {
    component.htmlValue.set('<p>Hello <script>alert(1)</script>World</p>');
    fixture.detectChanges();
    expect(element.innerHTML).toBe('<p>Hello alert(1)World</p>');
  });

  it('should utilize getTrustedHtml when rendering', () => {
    const getTrustedHtmlSpy = vi.spyOn(sanitizer, 'getTrustedHtml');
    component.htmlValue.set('<b>Bold</b>');
    fixture.detectChanges();

    expect(getTrustedHtmlSpy).toHaveBeenCalledWith('<b>Bold</b>');
    expect(element.innerHTML).toBe('<b>Bold</b>');
  });
});
