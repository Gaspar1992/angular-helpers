export interface LogEntry {
  readonly id: number;
  readonly time: string;
  readonly section: string;
  readonly message: string;
  readonly type: 'info' | 'success' | 'error';
}

export interface SerializerSample {
  readonly id: 'small' | 'uniform' | 'mixed';
  readonly label: string;
  readonly description: string;
  readonly build: () => unknown;
}

export interface SerializerResult {
  readonly name: string;
  readonly format: string;
  readonly bytes: number;
  readonly elapsedMs: number;
  readonly note?: string;
}

export interface FetchTimingResult {
  readonly transport: 'http-client' | 'worker-http';
  readonly status: number | 'error';
  readonly elapsedMs: number;
  readonly droppedFrames: number;
  readonly itemCount: number;
}
