/**
 * Detects if the current browser needs the streams ponyfill.
 *
 * Safari 16-17 fails to transfer `ReadableStream`/`TransformStream`
 * to/from Web Workers via `structuredClone` because they lack
 * the transferable streams implementation.
 *
 * @returns `true` if ponyfill is needed, `false` if native works
 */
export function needsPolyfill(): boolean {
  // Quick check: if we're not in a browser context, assume no polyfill needed
  if (typeof ReadableStream === 'undefined') {
    return false;
  }

  try {
    const rs = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    // Safari < 18 lacks the transferable streams spec extension
    // The presence of 'getReader' alone isn't enough — we need to verify
    // that the stream can be transferred via postMessage
    const channel = new MessageChannel();
    let transferable = true;

    // Try to transfer — this throws on Safari 16-17
    try {
      channel.port1.postMessage(rs, [rs as unknown as Transferable]);
    } catch {
      transferable = false;
    }

    channel.port1.close();
    channel.port2.close();

    return !transferable;
  } catch {
    // Any error means we should try polyfill
    return true;
  }
}

/**
 * User-agent based detection for Safari.
 * Used as a fast-path before the more expensive transfer test.
 */
export function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
}

/**
 * Check if Safari version is known to need polyfill (< 18).
 */
export function isLegacySafari(): boolean {
  if (!isSafari()) {
    return false;
  }

  const match = /Version\/(\d+)/.exec(navigator.userAgent);
  if (!match) {
    return false;
  }

  const version = Number.parseInt(match[1], 10);
  return version < 18;
}
