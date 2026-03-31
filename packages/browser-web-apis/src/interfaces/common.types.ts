// Common types for browser APIs

import { type ElementRef, type Signal } from '@angular/core';

export type BrowserError = Error & {
  name?: string;
  message?: string;
};

export type EventHandler<T = Event> = (event: T) => void;

// Generic storage value type
export type StorageValue = string | number | boolean | object | null;

// Generic error handler type
export type ErrorCallback = (error: BrowserError) => void;

/**
 * Accepted element input for inject functions.
 * Supports static elements, ElementRef, or deferred signals (e.g. from viewChild).
 */
export type ElementInput =
  | Element
  | ElementRef<Element>
  | Signal<Element | ElementRef<Element> | undefined>;
