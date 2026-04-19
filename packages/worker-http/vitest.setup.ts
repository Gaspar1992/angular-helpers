import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Initialise Angular's testing platform once per vitest worker. Without this
// any TestBed.configureTestingModule call throws "Need to call
// TestBed.initTestEnvironment() first".
try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // Already initialised by another spec in the same worker — safe to ignore.
}
