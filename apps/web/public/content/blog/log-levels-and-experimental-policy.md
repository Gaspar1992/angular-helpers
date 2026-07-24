---
title: 'browser-web-apis v21.11: log levels, experimental policy, and composition-first providers'
publishedAt: '2026-04-19'
tags: ['browser-web-apis', 'logging', 'dx', 'angular']
excerpt: 'Global log level control, one-time warnings for experimental APIs, and a composition-first provideBrowserWebApis({ services: [...] }) that replaces the flag-bag config.'
---

# Smaller noise, clearer intent

Three quality-of-life changes land together in `v21.11`: log level gating, an opt-in experimental policy, and a composition-first provider API.

## Log levels

```ts
import { provideBrowserApiLogLevel } from '@angular-helpers/browser-web-apis';

bootstrapApplication(App, {
  providers: [provideBrowserApiLogLevel('warn')],
});
```

The default is `isDevMode() ? 'debug' : 'warn'`, so production builds stop emitting informational noise automatically. Available levels: `debug | info | warn | error | silent`.

Under the hood, the default `BROWSER_API_LOGGER` is now level-gated: `debug`/`info` calls become no-ops when the level is higher. Every service gains a `logDebug()` method on the base class for verbose tracing that can be enabled on demand.

## Experimental policy

Experimental services can now emit a one-time warning on first use:

```ts
import {
  warnExperimental,
  BROWSER_API_EXPERIMENTAL_SILENT,
} from '@angular-helpers/browser-web-apis';

// In a service constructor:
warnExperimental('my-experimental-api', {
  silent: inject(BROWSER_API_EXPERIMENTAL_SILENT),
  logger: inject(BROWSER_API_LOGGER),
});
```

Consumers who accept the risk can silence the warnings globally:

```ts
providers: [{ provide: BROWSER_API_EXPERIMENTAL_SILENT, useValue: true }];
```

## Composition-first providers

The `enableX` flag bag is deprecated in favor of passing an array of provider calls:

```ts
provideBrowserWebApis({
  services: [provideCamera(), provideClipboard(), provideMediaApis()],
});
```

The old form keeps working and logs a deprecation warning once per process. It will be removed in `v22`.
