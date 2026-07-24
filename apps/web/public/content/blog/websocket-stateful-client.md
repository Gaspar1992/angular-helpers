---
title: 'browser-web-apis v21.6: stateful WebSocket client with signals, request/response, and a real reconnect'
publishedAt: '2026-04-18'
tags: ['browser-web-apis', 'websocket', 'signals', 'bugfix', 'angular']
excerpt: 'We rebuilt the WebSocket service around a stateful client class. State is a signal, reconnect uses exponential backoff with jitter, request/response is built-in via id correlation, and the old reconnect dead-loop bug is gone.'
---

# WebSocket, but for real this time

If you've been using `WebSocketService.connect()`, two things were quietly broken:

1. **The reconnect path never reconnected.** When the socket closed unclean and `attemptReconnect()` fired, it called `this.connect(config)` — which returns an Observable nobody subscribed to. The retry never executed.
2. **The Observable was multicast by side effect.** Every `subscribe()` re-armed the underlying socket because `disconnect()` lived inside the observable factory.

`v21.6` ships a redesigned API that fixes both, plus adds the features people were rebuilding by hand on top.

## The new shape

```ts
import { inject } from '@angular/core';
import { WebSocketService } from '@angular-helpers/browser-web-apis';

const ws = inject(WebSocketService);

const client = ws.createClient({
  url: 'wss://example.com/feed',
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  maxReconnectDelay: 30_000,
  heartbeatInterval: 15_000,
  heartbeatMessage: { type: 'ping' },
});
```

`client` is a `WebSocketClient` instance. It owns one connection and exposes:

- `client.status` — `Signal<WebSocketStatusV2>` (`idle | connecting | open | closing | closed | reconnecting`)
- `client.messages$` — `Observable<WebSocketMessage>`
- `client.send(message)` / `client.sendRaw(text)` — outbound traffic
- `client.request<TRes>(type, data, opts?)` — promise-based round-trip with id correlation
- `client.close()` — idempotent disposal (also runs on host destroy)

## Reactive status, no plumbing

```ts
import { effect } from '@angular/core';

effect(() => {
  const s = client.status();
  if (s.state === 'reconnecting') {
    console.log(`reconnect attempt #${s.reconnectAttempts}`);
  }
});
```

The state model is now explicit. No more inferring whether you're connecting from `connected: false && connecting: true && reconnecting: false`.

## Request/response with timeout

If your server echoes back `correlationId`, you can do request/response over a single socket:

```ts
const reply = await client.request<{ ok: boolean }>('compute', { n: 42 }, { timeout: 5000 });
```

Under the hood we generate a `crypto.randomUUID()`, attach it as `correlationId`, register a pending `{ resolve, reject, timer }`, and route any inbound message whose `correlationId` matches.

If the timer fires first, the entry is cleared and the promise rejects — no leaks.

## Reconnect that actually reconnects

Backoff with full jitter, capped:

```
baseDelay = min(maxReconnectDelay, reconnectInterval * 2^(attempt - 1))
delay     = random(0, baseDelay)
```

When `maxReconnectAttempts` is reached, status moves to `closed` with `error: "Max reconnect attempts (N) reached"`. No infinite retry, no silent stall.

Regression test in `web-socket.client.spec.ts` asserts a new `WebSocket` instance is constructed after an unclean close — exactly what the old code was missing.

## Backward compat

The legacy `connect() / disconnect() / send()` API still works. First call logs a one-time deprecation warning. We'll keep it around for the rest of the v21 cycle and remove it in v22.

## What's next

This is PR1 of 8 in the `browser-web-apis` hardening roadmap:

- PR2: WebStorage SecurityError safety + unified `local`/`session` API
- PR3: Standardize `isSupported()` across the 30 services
- PR4: WebWorker request/response + signals (same pattern as WebSocket)
- PR5: `inject*` primitives for clipboard, geolocation, battery, network, wake-lock
- PR6: Vitest unit-test infrastructure per service
- PR7: New APIs — Web Locks, Storage Manager, Compression Streams
- PR8: Logger levels + `@experimental` policy + composition-first providers

Each lands as its own PR.
