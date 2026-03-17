import { vi } from 'vitest';

// Mock de las APIs del navegador
Object.defineProperty(globalThis, 'navigator', {
  value: {
    permissions: {
      query: vi.fn(),
      request: vi.fn()
    },
    mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    geolocation: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    },
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn()
    }
  },
  writable: true
});

// Mock de Notification API
Object.defineProperty(globalThis, 'Notification', {
  value: {
    requestPermission: vi.fn(),
    constructor: vi.fn()
  },
  writable: true
});

// Mock de MediaStream
Object.defineProperty(globalThis, 'MediaStream', {
  value: vi.fn().mockImplementation(() => ({
    getTracks: vi.fn(() => [{ stop: vi.fn() }])
  })),
  writable: true
});

// Mock de URL.createObjectURL
Object.defineProperty(globalThis, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

// Mock de document.createElement
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    if (tagName === 'video') {
      return {
        srcObject: null,
        play: vi.fn(),
        videoWidth: 1280,
        videoHeight: 720
      };
    }
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          toBlob: vi.fn((callback) => {
            callback(new Blob(['mock'], { type: 'image/png' }));
          })
        }))
      };
    }
    return {};
  }),
  writable: true
});
