// Common types for browser APIs

export type BrowserError = Error & {
  name?: string;
  message?: string;
};

export type EventHandler<T = Event> = (event: T) => void;

// Generic storage value type
export type StorageValue = string | number | boolean | object | null;

// Generic error handler type
export type ErrorCallback = (error: BrowserError) => void;
