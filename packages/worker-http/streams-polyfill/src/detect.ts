/**
 * Detects if the current browser needs the streams ponyfill.
 *
 * Safari 16-17 fails to transfer `ReadableStream`/`TransformStream`
 * to/from Web Workers via `structuredClone` because they lack
 * the transferable streams implementation.
 *
 * @param userAgent - Optional user agent string for testing (defaults to feature detection)
 * @returns `true` if ponyfill is needed, `false` if native works
 */
export function needsPolyfill(userAgent?: string): boolean {
  // If userAgent provided (testing mode), use UA-based detection
  if (userAgent !== undefined) {
    return isLegacySafari(userAgent);
  }

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
 *
 * @param userAgent - Optional user agent string (defaults to navigator.userAgent)
 */
export function isSafari(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
}

/**
 * Check if Safari version is known to need polyfill (< 18).
 *
 * @param userAgent - Optional user agent string (defaults to navigator.userAgent)
 */
export function isLegacySafari(userAgent?: string): boolean {
  if (!isSafari(userAgent)) {
    return false;
  }

  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const match = /Version\/(\d+)/.exec(ua);
  if (!match) {
    return false;
  }

  const version = Number.parseInt(match[1], 10);
  return version < 18;
}
