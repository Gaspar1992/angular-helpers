import { InjectionToken } from '@angular/core';
import type { Translations } from './en';

export const I18N = new InjectionToken<Translations>('I18N');
