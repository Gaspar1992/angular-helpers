/// <reference lib="webworker" />

async function processMessage(data: any): Promise<void> {
  const { type, requestId, payload } = data;

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
}

self.onmessage = async (event: MessageEvent) => {
  const data = event.data;

  if (data.type === 'batch') {
    const promises = (data.messages || []).map((msg: any) => processMessage(msg));
    await Promise.all(promises);
  } else {
    await processMessage(data);
  }
};
