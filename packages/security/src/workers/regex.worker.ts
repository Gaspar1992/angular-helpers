/// <reference lib="webworker" />

self.addEventListener('message', function (event: MessageEvent) {
  const task = event.data;

  if (task.type === 'regex-test') {
    const { pattern, text } = task.data;
    const startTime = performance.now();

    try {
      const regex = new RegExp(pattern, 'g');
      const matches: RegExpMatchArray[] = [];
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        matches.push([...match] as unknown as RegExpMatchArray);

        // Prevention of infinite loops
        if (matches.length > 1000) {
          throw new Error('Too many matches - possible infinite loop');
        }
      }

      const groups: { [key: string]: string } = {};
      if (matches.length > 0) {
        const firstMatch = matches[0];
        for (let i = 1; i < firstMatch.length; i++) {
          groups[`group${i}`] = firstMatch[i];
        }
      }

      self.postMessage({
        id: task.id,
        type: 'regex-result',
        data: {
          match: matches.length > 0,
          matches,
          groups,
          executionTime: performance.now() - startTime,
          timeout: false,
        },
      });
    } catch (error) {
      self.postMessage({
        id: task.id,
        type: 'regex-result',
        data: {
          match: false,
          executionTime: performance.now() - startTime,
          timeout: false,
          error: error instanceof Error ? error.message : 'Execution error',
        },
      });
    }
  }
});
