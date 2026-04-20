---
title: 'browser-web-apis v21.11: Signal-based Injection & Composition-First API'
publishedAt: '2026-04-19'
tags: ['browser-web-apis', 'signals', 'inject', 'angular', 'v21.11', 'composition-api']
excerpt: 'Four new signal-based inject functions bring reactive Battery, Clipboard, Geolocation, and Screen Wake Lock APIs to your components. Plus the new composition-first provider API replaces the legacy flag-bag configuration for better tree-shaking and explicit dependencies.'
---

# Reactive browser APIs without the boilerplate

`v21.11` of `@angular-helpers/browser-web-apis` introduces **signal-based injection functions** for four more browser APIs, completing our migration from RxJS-heavy services to lightweight, reactive primitives that feel native in Angular v20+.

## The problem we solved

Before v21.11, accessing the Battery Status API or handling clipboard operations required:

1. Injecting a service
2. Managing subscriptions manually
3. Handling cleanup in `ngOnDestroy`
4. Writing RxJS pipes for simple state changes

```ts
// Before: Verbose RxJS-based approach
@Component({...})
export class BatteryComponent implements OnDestroy {
  private battery = inject(BatteryService);
  level = signal<number | null>(null);
  private sub = this.battery.watchStatus().subscribe(s =>
    this.level.set(s.level)
  );

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
```

## The signal-based solution

```ts
// After: Clean, reactive, auto-cleanup
@Component({...})
export class BatteryComponent {
  protected battery = injectBattery();

  get batteryPercent() {
    return Math.round(this.battery.level() * 100);
  }
}
```

The `injectBattery()` function returns a `BatteryRef` with signals for:

- `level`: Current battery level (0.0 to 1.0)
- `charging`: Whether battery is charging
- `chargingTime` / `dischargingTime`: Estimated time remaining
- `isSupported`: Whether Battery API is available
- `error`: Any error from battery operations

Cleanup is automatic via Angular's `DestroyRef`.

## Four new inject functions

### injectBattery — Battery Status API

```ts
@Component({...})
export class PowerAwareComponent {
  protected battery = injectBattery();

  protected statusMessage = computed(() => {
    if (!this.battery.isSupported()) {
      return 'Battery API not available';
    }
    if (this.battery.charging()) {
      return `Charging: ${this.batteryPercent()}%`;
    }
    return `Battery: ${this.batteryPercent()}%`;
  });
}
```

### injectClipboard — Clipboard API

```ts
@Component({...})
export class ShareComponent {
  protected clipboard = injectClipboard();

  async copyToClipboard(text: string) {
    await this.clipboard.writeText(text);
    // clipboard.text() signal updates automatically
    // clipboard.busy() tracks pending operations
  }
}
```

Features:

- `text`: Current clipboard content (when permission granted)
- `busy`: True during async operations
- `isSupported`: Feature detection
- `readText()` / `writeText()`: Async methods with signal updates

### injectGeolocation — Geolocation API

```ts
@Component({...})
export class TrackerComponent {
  protected geo = injectGeolocation({
    watch: true,  // Continuous tracking
    enableHighAccuracy: true
  });

  protected distance = computed(() => {
    const pos = this.geo.position();
    if (!pos) return 0;
    return calculateDistanceFromStart(pos);
  });
}
```

Signals:

- `position`: Current GeolocationPosition or null
- `error`: Geolocation error message
- `watching`: Whether actively tracking
- `isSupported`: API availability

### injectWakeLock — Screen Wake Lock API

```ts
@Component({...})
export class PresentationComponent {
  protected wakeLock = injectWakeLock();

  async toggle() {
    if (this.wakeLock.active()) {
      await this.wakeLock.release();
    } else {
      await this.wakeLock.request();
    }
  }
}
```

Prevents screen dimming/locking during presentations or critical operations.

## Composition-First Provider API

Alongside the inject functions, v21.11 introduces a **new way to provide services** that replaces the legacy flag-bag configuration.

### The old way (deprecated)

```ts
// Deprecated: Magic flags, implicit behavior
provideBrowserWebApis({
  enableCamera: true,
  enableGeolocation: true,
  enableWebStorage: true,
  // Which services are actually used? Unclear.
});
```

Problems:

- Magic flags hide actual dependencies
- Hard to tree-shake unused services
- No IDE autocomplete for service classes
- Runtime errors for disabled services

### The new way (composition-first)

```ts
import {
  CameraService,
  GeolocationService,
  WebStorageService,
} from '@angular-helpers/browser-web-apis';

// New: Explicit, type-safe, tree-shakable
provideBrowserWebApis({
  services: [CameraService, GeolocationService, WebStorageService],
});
```

Benefits:

- **Explicit dependencies**: You see exactly what's provided
- **IDE support**: Full autocomplete for service classes
- **Tree-shaking**: Unused services are removed at build time
- **Type safety**: Compiler catches missing imports
- **Self-documenting**: Code reviews show intent clearly

## Migration guide

### From flag-bag to composition-first

**Before:**

```ts
provideBrowserWebApis({
  enableCamera: true,
  enableNotifications: true,
});
```

**After:**

```ts
import { CameraService, NotificationService } from '@angular-helpers/browser-web-apis';

provideBrowserWebApis({
  services: [CameraService, NotificationService],
});
```

The old API still works but is deprecated. Migrate at your own pace.

## What's NOT in this release

To keep scope manageable, we explicitly excluded:

- **No new experimental services**: v21.11 focuses on stable, well-supported APIs
- **No breaking changes**: Flag-bag API is deprecated but functional
- **No additional packages**: These features are browser-web-apis only

## Try it now

```bash
npm install @angular-helpers/browser-web-apis
```

All 40 services + 13 signal-based inject functions are ready to use.

## Design decisions

1. **Why signals over RxJS?** Signals are Angular's future. They reduce bundle size, simplify change detection, and eliminate manual subscription management.

2. **Why composition-first?** After maintaining the library for multiple versions, we observed that explicit dependency lists are easier to debug and optimize than magic flags.

3. **Why auto-cleanup?** `DestroyRef` is the idiomatic Angular way. We use it consistently across all inject functions so you never leak listeners.

## Links

- [Documentation](/docs/browser-web-apis)
- [Source on GitHub](https://github.com/Gaspar1992/angular-helpers)
- [npm package](https://www.npmjs.com/package/@angular-helpers/browser-web-apis)
