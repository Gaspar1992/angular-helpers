/// <reference lib="webworker" />

self.onmessage = async (event: MessageEvent) => {
  const { type, requestId, payload } = event.data;

  if (type === 'cancel') {
    return;
  }

  if (type === 'request') {
    const delay = payload?.delay ?? 0;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    self.postMessage({
      type: 'response',
      requestId,
      result: {
        echo: payload,
        timestamp: Date.now(),
        thread: 'worker',
      },
    });
  }
};
