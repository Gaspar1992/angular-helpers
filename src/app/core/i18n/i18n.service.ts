import { Injectable, signal, computed } from '@angular/core';
import { EN, type Translations } from './en';

export type SupportedLocale = 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _locale = signal<SupportedLocale>('en');

  readonly locale = this._locale.asReadonly();

  readonly t = computed<Translations>(() => {
    switch (this._locale()) {
      default:
        return EN;
    }
  });

  setLocale(locale: SupportedLocale): void {
    this._locale.set(locale);
  }
}
