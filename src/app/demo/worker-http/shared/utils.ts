/**
 * Best-effort byte size of a value as it would travel over the wire.
 * - `ArrayBuffer` → byteLength
 * - `string` → UTF-8 byte length
 * - everything else → JSON.stringify then UTF-8 byte length
 */
export function byteSize(value: unknown): number {
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (typeof value === 'string') return new TextEncoder().encode(value).byteLength;
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export interface DroppedFrameMonitor {
  readonly stop: () => number;
}

/**
 * Counts `requestAnimationFrame` deltas above 25 ms while running.
 * Returns the dropped-frame count when stopped.
 *
 * Used as a proxy for visible jank when comparing main-thread vs worker workloads.
 */
export function startDroppedFrameMonitor(): DroppedFrameMonitor {
  let dropped = 0;
  let last = performance.now();
  let active = true;
  let raf = 0;

  const tick = (now: number) => {
    if (!active) return;
    const delta = now - last;
    if (delta > 25) dropped++;
    last = now;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    stop: () => {
      active = false;
      cancelAnimationFrame(raf);
      return dropped;
    },
  };
}

export interface CpuBurnHandle {
  readonly stop: () => void;
}

/**
 * Loads the main thread with synchronous busy-loop chunks of ~12 ms,
 * yielding via `setTimeout(0)` between chunks so the microtask queue
 * can drain. Stops automatically after `durationMs`.
 */
export function startCpuBurn(durationMs: number): CpuBurnHandle {
  const deadline = performance.now() + durationMs;
  let active = true;

  const burn = (): void => {
    if (!active || performance.now() >= deadline) return;
    const chunkEnd = performance.now() + 12;
    let x = 0;
    while (performance.now() < chunkEnd) {
      x += Math.sqrt(performance.now()) * Math.random();
    }
    void x;
    setTimeout(burn, 0);
  };
  burn();

  return {
    stop: () => {
      active = false;
    },
  };
}
