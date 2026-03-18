import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

// Initialize Angular testing environment
TestBed.initTestEnvironment();

// Global test setup
beforeEach(() => {
  // Reset TestBed configuration before each test
  TestBed.resetTestingModule();
});

// Global mocks for browser APIs
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
  },
  writable: true
});

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
  },
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test',
    mediaDevices: {
      enumerateDevices: vi.fn(),
      getUserMedia: vi.fn(),
      getDisplayMedia: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    geolocation: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    },
    permissions: {
      query: vi.fn(),
      request: vi.fn()
    },
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
      write: vi.fn(),
      read: vi.fn()
    },
    getBattery: vi.fn(),
    share: vi.fn(),
    canShare: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    Notification: {
      requestPermission: vi.fn(),
      maxActions: 2
    },
    ClipboardItem: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    execCommand: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};
