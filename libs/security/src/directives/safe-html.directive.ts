/* eslint-disable @angular-eslint/directive-selector */
import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { InputSanitizerService } from '../services/input-sanitizer.service';

@Directive({
  selector: '[safeHtml]',
})
export class SafeHtmlDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly sanitizer = inject(InputSanitizerService);

  readonly safeHtml = input<string | null>(null);

  constructor() {
    effect(() => {
      const htmlVal = this.safeHtml();
      if (htmlVal === null || htmlVal === undefined) {
        this.elementRef.nativeElement.innerHTML = '';
        return;
      }

      if (this.sanitizer.isSupported()) {
        const sanitized = this.sanitizer.sanitizeHtml(htmlVal);
        const trusted = this.sanitizer.getTrustedHtml(sanitized);
        this.elementRef.nativeElement.innerHTML = trusted;
      } else {
        this.elementRef.nativeElement.innerHTML = htmlVal;
      }
    });
  }
}
