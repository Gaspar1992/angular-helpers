export function isPlatformBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isPlatformServer(): boolean {
  return !isPlatformBrowser();
}

export function getGlobalWindow(): Window | undefined {
  return isPlatformBrowser() ? window : undefined;
}
