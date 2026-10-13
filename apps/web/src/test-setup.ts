import { setupHeadlessBrowserMocks } from '@angular-helpers/testing';

// Initialize shared headless browser mocks (ResizeObserver, IntersectionObserver, WebCrypto, Canvas2D, BroadcastChannel)
setupHeadlessBrowserMocks();

import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
