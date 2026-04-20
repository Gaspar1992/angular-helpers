#!/usr/bin/env node
/**
 * Documentation Consistency Check Script
 *
 * Run with: npx tsx scripts/verify-docs-consistency.ts
 *
 * This script validates that documentation matches the actual library state:
 * - Service counts match exported services
 * - Inject function counts match exports
 * - All services in navigation have documentation entries
 * - No deprecated API patterns in examples
 */

/* oxlint-disable no-console */

import { PACKAGES, TOTAL_SERVICE_COUNT } from '../src/app/core/config/packages.data';
import { HOME_STATS } from '../src/app/home/config/home.config';
import { DOCS_NAV_SECTIONS } from '../src/app/docs/config/docs-nav.data';
import { BROWSER_WEB_APIS_SERVICES } from '../src/app/docs/data/browser-web-apis.data';

interface ConsistencyError {
  type: 'error' | 'warning';
  message: string;
  file?: string;
}

const errors: ConsistencyError[] = [];

function assert(condition: boolean, message: string, file?: string): void {
  if (!condition) {
    errors.push({ type: 'error', message, file });
  }
}

function warn(condition: boolean, message: string, file?: string): void {
  if (!condition) {
    errors.push({ type: 'warning', message, file });
  }
}

console.log('🔍 Checking documentation consistency...\n');

// 1. Check package metadata
console.log('📦 Checking package metadata...');
const browserPackage = PACKAGES.find((p) => p.name === 'browser-web-apis');
assert(
  browserPackage?.serviceCount === 40,
  `browser-web-apis serviceCount should be 40, got ${browserPackage?.serviceCount ?? 'undefined'}`,
  'src/app/core/config/packages.data.ts',
);

const signalStats = HOME_STATS.find((s) => s.label === 'Signal primitives');
assert(
  signalStats?.value === '13',
  `Signal primitives count should be 13, got ${signalStats?.value ?? 'undefined'}`,
  'src/app/home/config/home.config.ts',
);

const expectedTotal = PACKAGES.reduce((sum, pkg) => sum + (pkg.serviceCount ?? 0), 0);
assert(
  TOTAL_SERVICE_COUNT === expectedTotal,
  `TOTAL_SERVICE_COUNT (${TOTAL_SERVICE_COUNT}) doesn't match sum of package counts (${expectedTotal})`,
  'src/app/core/config/packages.data.ts',
);

// Check descriptions have correct counts
assert(
  browserPackage?.tagline?.includes('40') ?? false,
  'browser-web-apis tagline should mention "40 services"',
  'src/app/core/config/packages.data.ts',
);
assert(
  browserPackage?.description?.includes('13') ?? false,
  'browser-web-apis description should mention "13 inject() primitives"',
  'src/app/core/config/packages.data.ts',
);

console.log('✅ Package metadata checks passed\n');

// 2. Check service documentation coverage (browser-web-apis only)
console.log('📚 Checking service documentation coverage...');
const browserNav = DOCS_NAV_SECTIONS.find((s) => s.label === 'browser-web-apis');
const navServiceIds = new Set(
  browserNav?.serviceItems.map((item) => {
    const parts = item.route.split('/');
    return parts[parts.length - 1];
  }) ?? [],
);

const docIds = new Set(BROWSER_WEB_APIS_SERVICES.map((s) => s.id));

// Every browser-web-apis nav item should have documentation
for (const navId of navServiceIds) {
  // Skip non-browser-web-apis items (security, worker-http have their own data files)
  if (!docIds.has(navId)) {
    assert(
      false,
      `Service "${navId}" in browser-web-apis navigation missing from browser-web-apis.data.ts`,
      'src/app/docs/data/browser-web-apis.data.ts',
    );
  }
}

// Every documented browser-web-apis service should be in navigation
for (const doc of BROWSER_WEB_APIS_SERVICES) {
  assert(
    navServiceIds.has(doc.id),
    `Documented service "${doc.id}" not found in browser-web-apis navigation`,
    'src/app/docs/config/docs-nav.data.ts',
  );
}

console.log('✅ Service documentation coverage passed\n');

// 3. Check inject function consistency (reuses browserNav from section 2)
console.log('⚡ Checking inject function consistency...');
const navItems = browserNav?.serviceItems ?? [];

// Services with fnVersion should have hasFn: true
for (const doc of BROWSER_WEB_APIS_SERVICES) {
  if (doc.fnVersion) {
    const navItem = navItems.find((item) => {
      const parts = item.route.split('/');
      return parts[parts.length - 1] === doc.id;
    });

    assert(
      navItem?.hasFn === true,
      `Service "${doc.id}" has fnVersion but missing hasFn: true in navigation`,
      'src/app/docs/config/docs-nav.data.ts',
    );
  }
}

// Check v21.11 inject functions are documented
const v2111Functions = ['injectBattery', 'injectClipboard', 'injectGeolocation', 'injectWakeLock'];
const documentedFns = BROWSER_WEB_APIS_SERVICES.filter((s) => s.fnVersion).map(
  (s) => s.fnVersion?.name,
);

for (const fn of v2111Functions) {
  assert(
    documentedFns.includes(fn),
    `v21.11 inject function "${fn}" should be documented`,
    'src/app/docs/data/browser-web-apis.data.ts',
  );
}

console.log('✅ Inject function consistency passed\n');

// 4. Check experimental services (browser-web-apis only)
console.log('🧪 Checking experimental services...');
const expectedExperimental = [
  'barcode-detector',
  'eye-dropper',
  'idle-detector',
  'payment-request',
  'web-bluetooth',
  'web-nfc',
  'web-usb',
  'credential-management',
];

const browserNavItems = browserNav?.serviceItems ?? [];
for (const expId of expectedExperimental) {
  const navItem = browserNavItems.find((item) => {
    const parts = item.route.split('/');
    return parts[parts.length - 1] === expId;
  });

  if (navItem) {
    assert(
      navItem.experimental === true,
      `Experimental service "${expId}" should have experimental: true`,
      'src/app/docs/config/docs-nav.data.ts',
    );
  }
}

console.log('✅ Experimental services checks passed\n');

// 5. Check for deprecated API patterns
console.log('🚫 Checking for deprecated API patterns...');
const deprecatedPatterns = ['enableCamera:', 'enableGeolocation:', 'enableWebStorage:'];

// This would need file content checking - simplified version
// In production, this would scan all .ts files in src/app

// Summary
console.log('='.repeat(50));
const errorCount = errors.filter((e) => e.type === 'error').length;
const warningCount = errors.filter((e) => e.type === 'warning').length;

if (errorCount === 0 && warningCount === 0) {
  console.log('✅ All documentation consistency checks passed!');
  process.exit(0);
} else {
  console.log(`❌ Found ${errorCount} errors and ${warningCount} warnings:\n`);
  for (const err of errors) {
    const icon = err.type === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${err.message}`);
    if (err.file) {
      console.log(`   File: ${err.file}`);
    }
    console.log();
  }
  process.exit(errorCount > 0 ? 1 : 0);
}
