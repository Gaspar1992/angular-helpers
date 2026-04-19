---
title: 'browser-web-apis v21.9: signal primitives for clipboard, geolocation, battery, and wake-lock'
publishedAt: '2026-04-18'
tags: ['browser-web-apis', 'signals', 'angular']
excerpt: 'Four new inject* primitives complete the signal-first surface for ambient browser state — drop them into a component and read state via signals, with cleanup wired to DestroyRef.'
---

# Signals for the rest of the browser

The `inject*` family in `@angular-helpers/browser-web-apis` already covered observers and ambient sensors (page visibility, resize, intersection, mutation, performance, network info, screen orientation, gamepad). `v21.9` ships the four pieces that were still missing:

```ts
import {
  injectClipboard,
  injectGeolocation,
  injectBattery,
  injectWakeLock,
} from '@angular-helpers/browser-web-apis';

@Component({ ... })
export class MyComponent {
  clipboard = injectClipboard();
  geo = injectGeolocation({ watch: true });
  battery = injectBattery();
  wake = injectWakeLock();

  paste = async () => {
    const text = await this.clipboard.readText();
    if (text) console.log('pasted:', text);
  };

  startKiosk = () => this.wake.request();
}
```

## What you get

Each primitive returns a `*Ref` object exposing readonly signals plus imperative actions:

- `injectClipboard()` → `{ text, error, busy, isSupported, writeText, readText }`
- `injectGeolocation(opts?)` → `{ position, error, watching, isSupported, watch, stop, getCurrent }`
- `injectBattery()` → `{ info, error, isSupported, refresh }`
- `injectWakeLock()` → `{ active, error, isSupported, request, release }`

All cleanup is wired to `DestroyRef` automatically. No manual `unsubscribe` or `removeEventListener`.

## SSR-safe

Every primitive checks `isPlatformBrowser` and `isSupported` before touching globals. On the server, `isSupported` returns `false`, signals stay at their initial values, and imperative methods short-circuit instead of throwing.

## Cleanup contract

- `injectGeolocation`: stops `watchPosition` on destroy
- `injectBattery`: removes all four `BatteryManager` event listeners on destroy
- `injectWakeLock`: releases the active sentinel on destroy
- `injectClipboard`: ignores results that arrive after destroy

## Roadmap

PR5 of 8. Up next: PR6 wires Vitest properly so all the specs we've been writing actually run in CI.
