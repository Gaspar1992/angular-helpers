import { vi } from 'vitest';

// Global test setup for browser APIs

// Mock Web Workers
global.Worker = vi.fn(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as any;

// Mock URL and Blob for Worker creation
global.URL = class MockURL {
  constructor(public url: string, base?: string) {}
  static createObjectURL = vi.fn(() => 'blob:mock-url');
  static revokeObjectURL = vi.fn();
} as any;

global.Blob = vi.fn((content, options) => ({ content, options })) as any;

// Mock performance.now
global.performance = {
  now: vi.fn(() => Date.now()),
} as any;

// Mock Storage APIs
const createMockStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
  };
};

global.localStorage = createMockStorage() as any;
global.sessionStorage = createMockStorage() as any;

// Mock Notification API
global.Notification = {
  requestPermission: vi.fn(() => Promise.resolve('granted')),
  permission: 'granted' as NotificationPermission,
} as any;

// Mock Geolocation API
global.navigator = {
  ...global.navigator,
  geolocation: {
    getCurrentPosition: vi.fn((success) => {
      success({
        coords: { latitude: 40.7128, longitude: -74.0060 },
        timestamp: Date.now()
      });
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  mediaDevices: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    })),
    enumerateDevices: vi.fn(() => Promise.resolve([])),
  },
  permissions: {
    query: vi.fn(() => Promise.resolve({ state: 'granted' })),
    request: vi.fn(() => Promise.resolve({ state: 'granted' })),
  },
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('mock text')),
  },
  battery: {
    level: 0.8,
    charging: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
} as any;

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
  CONNECTING: WebSocket.CONNECTING,
  OPEN: WebSocket.OPEN,
  CLOSING: WebSocket.CLOSING,
  CLOSED: WebSocket.CLOSED,
})) as any;

// Mock console methods for testing
const originalConsole = { ...console };

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Restore console if needed
  Object.assign(console, originalConsole);
});

// Global test utilities
(global as any).mockWorker = {
  create: (script: string) => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
    script,
  }),
};

(global as any).mockStorage = {
  create: createMockStorage,
  setItem: (storage: any, key: string, value: string) => {
    storage.setItem(key, value);
  },
  getItem: (storage: any, key: string) => {
    return storage.getItem(key);
  },
};

// Export for use in tests
export { vi };
