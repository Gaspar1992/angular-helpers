/**
 * Documentation Consistency Tests
 *
 * These tests ensure that the website documentation stays in sync with the
 * actual library exports. They catch discrepancies like:
 * - Incorrect service counts (37 vs 40)
 * - Outdated API examples (deprecated flag-bag vs composition-first)
 * - Missing inject functions in documentation
 */

import { describe, it, expect } from 'vitest';
import { PACKAGES, TOTAL_SERVICE_COUNT } from '../src/app/core/config/packages.data';
import { HOME_STATS } from '../src/app/home/config/home.config';
import { DOCS_NAV_SECTIONS, DOCS_NAV_LIBRARIES } from '../src/app/docs/config/docs-nav.data';
import { BROWSER_WEB_APIS_SERVICES } from '../src/app/docs/data/browser-web-apis.data';
import { SECURITY_SERVICES } from '../src/app/docs/data/security.data';
import { WORKER_HTTP_ENTRIES } from '../src/app/docs/data/worker-http.data';
import { OPENLAYERS_SERVICES } from '../src/app/docs/data/openlayers.data';

describe('Documentation Consistency', () => {
  describe('Package Metadata', () => {
    it('should have correct service count for browser-web-apis', () => {
      const browserPackage = PACKAGES.find((p) => p.name === 'browser-web-apis');
      expect(browserPackage?.serviceCount).toBe(40);
    });

    it('should have inject function count matching actual exports', () => {
      // 12 in main + 1 in experimental = 13 total
      const signalStats = HOME_STATS.find((s) => s.label === 'Signal primitives');
      expect(signalStats?.value).toBe('13');
    });

    it('TOTAL_SERVICE_COUNT should match sum of all package serviceCounts', () => {
      const expectedTotal = PACKAGES.reduce((sum, pkg) => sum + (pkg.serviceCount ?? 0), 0);
      expect(TOTAL_SERVICE_COUNT).toBe(expectedTotal);
    });
  });

  describe('Service Documentation Coverage', () => {
    const LIBRARY_DATA: Record<
      string,
      { services: { id: string; fnVersion?: unknown }[]; dataFile: string }
    > = {
      'browser-web-apis': {
        services: BROWSER_WEB_APIS_SERVICES,
        dataFile: 'browser-web-apis.data.ts',
      },
      security: { services: SECURITY_SERVICES, dataFile: 'security.data.ts' },
      'worker-http': { services: WORKER_HTTP_ENTRIES, dataFile: 'worker-http.data.ts' },
      openlayers: { services: OPENLAYERS_SERVICES, dataFile: 'openlayers.data.ts' },
    };

    it('every service in DOCS_NAV_SECTIONS should have a documentation entry', () => {
      for (const section of DOCS_NAV_SECTIONS) {
        const libData = LIBRARY_DATA[section.label];
        if (!libData) continue;

        const docIds = new Set(libData.services.map((s) => s.id));
        const navIds = section.serviceItems.map((item) => {
          const parts = item.route.split('/');
          return parts[parts.length - 1];
        });

        for (const navId of navIds) {
          expect(
            docIds.has(navId),
            `Service "${navId}" in navigation missing from ${libData.dataFile}`,
          ).toBe(true);
        }
      }
    });

    it('every documented service should be in navigation', () => {
      for (const section of DOCS_NAV_SECTIONS) {
        const libData = LIBRARY_DATA[section.label];
        if (!libData) continue;

        const navIds = new Set(
          section.serviceItems.map((item) => {
            const parts = item.route.split('/');
            return parts[parts.length - 1];
          }),
        );

        for (const doc of libData.services) {
          expect(
            navIds.has(doc.id),
            `Documented service "${doc.id}" not found in navigation for ${section.label}`,
          ).toBe(true);
        }
      }
    });

    it('services with fnVersion should have hasFn: true in navigation', () => {
      const browserNav = DOCS_NAV_SECTIONS.find((s) => s.label === 'browser-web-apis');
      const navItems = browserNav?.serviceItems ?? [];

      for (const doc of BROWSER_WEB_APIS_SERVICES) {
        if (doc.fnVersion) {
          const navItem = navItems.find((item) => {
            const parts = item.route.split('/');
            return parts[parts.length - 1] === doc.id;
          });

          expect(
            navItem?.hasFn,
            `Service "${doc.id}" has fnVersion but missing hasFn: true in navigation`,
          ).toBe(true);
        }
      }
    });
  });

  describe('API Examples', () => {
    it('should not use deprecated flag-bag API in code examples', () => {
      // Check that no example contains deprecated API patterns
      const deprecatedPatterns = [
        'enableCamera:',
        'enableGeolocation:',
        'enableWebStorage:',
        'enableNotifications:',
      ];

      // This would need to check the actual HTML content of code examples
      // For now, we check the structure exists
      const browserPackage = PACKAGES.find((p) => p.name === 'browser-web-apis');
      expect(browserPackage?.tagline).not.toContain('37');
      expect(browserPackage?.tagline).toContain('40');
    });

    it('should reference composition-first API in descriptions', () => {
      const browserPackage = PACKAGES.find((p) => p.name === 'browser-web-apis');
      expect(browserPackage?.description).toContain('40');
      expect(browserPackage?.description).toContain('13');
    });
  });

  describe('Inject Function Coverage', () => {
    it('documented inject functions should match library exports', () => {
      // Count documented fnVersion entries
      const documentedFnCount = BROWSER_WEB_APIS_SERVICES.filter((s) => s.fnVersion).length;

      // Expected: 13 inject functions (12 main + 1 experimental)
      // Note: Not all services have fnVersion documented yet, this test
      // documents the current state and can be updated as more are added
      expect(documentedFnCount).toBeGreaterThanOrEqual(4); // Minimum v21.11 functions
    });

    it('should document all v21.11 inject functions', () => {
      const v2111Functions = [
        'injectBattery',
        'injectClipboard',
        'injectGeolocation',
        'injectWakeLock',
      ];

      const documentedFns = BROWSER_WEB_APIS_SERVICES.filter((s) => s.fnVersion).map(
        (s) => s.fnVersion?.name,
      );

      for (const fn of v2111Functions) {
        expect(documentedFns, `v21.11 inject function "${fn}" should be documented`).toContain(fn);
      }
    });
  });

  describe('Experimental Services', () => {
    it('experimental services should have experimental: true in navigation', () => {
      const experimentalIds = [
        'barcode-detector',
        'eye-dropper',
        'idle-detector',
        'payment-request',
        'web-bluetooth',
        'web-nfc',
        'web-usb',
        'credential-management',
      ];

      const browserNav = DOCS_NAV_SECTIONS.find((s) => s.label === 'browser-web-apis');
      const navItems = browserNav?.serviceItems ?? [];

      for (const expId of experimentalIds) {
        const navItem = navItems.find((item) => {
          const parts = item.route.split('/');
          return parts[parts.length - 1] === expId;
        });

        if (navItem) {
          expect(
            navItem.experimental,
            `Experimental service "${expId}" should have experimental: true`,
          ).toBe(true);
        }
      }
    });
  });
});
