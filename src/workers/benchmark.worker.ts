/// <reference lib="webworker" />

self.onmessage = (event: MessageEvent<{ size: number; useTransferable: boolean }>) => {
  const { size, useTransferable } = event.data;

  const startTime = performance.now();

  // 1. Generate heavy data
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    view[i] = i % 256;
  }

  const generationTime = performance.now() - startTime;

  // 2. Send back to main thread
  const messageStartTime = performance.now();
  if (useTransferable) {
    self.postMessage(
      {
        type: 'benchmark-result',
        generationTime,
        data: buffer,
      },
      [buffer],
    );
  } else {
    self.postMessage({
      type: 'benchmark-result',
      generationTime,
      data: buffer,
    });
  }
};
