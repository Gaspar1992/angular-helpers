import { webcrypto } from 'node:crypto';

// jsdom exposes globalThis.crypto without .subtle — patch it with Node's WebCrypto
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment([BrowserTestingModule], platformBrowserTesting());
