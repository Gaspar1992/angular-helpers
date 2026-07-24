import { getNavLibrariesForVersion } from './docs-nav.data';
import { AngularVersion } from '../models/angular-version.model';

describe('docs-nav.data versioning', () => {
  it('should return all libraries for v22', () => {
    const libraries = getNavLibrariesForVersion('v22');
    expect(libraries.map((lib) => lib.id)).toContain('openlayers');
  });

  it('should include openlayers library for v21', () => {
    const libraries = getNavLibrariesForVersion('v21');
    expect(libraries.map((lib) => lib.id)).toContain('openlayers');
  });

  it('should filter out experimental features for v21', () => {
    const libraries = getNavLibrariesForVersion('v21');
    const browserWebApis = libraries.find((lib) => lib.id === 'browser-web-apis');
    expect(browserWebApis).toBeDefined();

    const hasExperimental = browserWebApis!.sections.some((section) =>
      section.items.some((item) => (item as any).experimental),
    );
    expect(hasExperimental).toBe(false);
  });

  it('should filter out items with since: v22 for v21', () => {
    const libraries = getNavLibrariesForVersion('v21');
    const allItems = libraries.flatMap((lib) => lib.sections.flatMap((section) => section.items));

    const hasSinceV22 = allItems.some((item) => (item as any).since === AngularVersion.v22);
    expect(hasSinceV22).toBe(false);
  });

  it('should keep items with since: v22 for v22', () => {
    const libraries = getNavLibrariesForVersion('v22');
    const allItems = libraries.flatMap((lib) => lib.sections.flatMap((section) => section.items));

    const sinceV22Items = allItems.filter((item) => (item as any).since === AngularVersion.v22);
    expect(sinceV22Items.length).toBeGreaterThan(0);
  });

  it('should hide realtime from worker-http for v21', () => {
    const libraries = getNavLibrariesForVersion('v21');
    const workerHttp = libraries.find((lib) => lib.id === 'worker-http');
    expect(workerHttp).toBeDefined();

    const allLabels = workerHttp!.sections.flatMap((s) => s.items.map((i) => i.label));
    expect(allLabels).not.toContain('Realtime Clients');
  });

  it('should show realtime in worker-http for v22', () => {
    const libraries = getNavLibrariesForVersion('v22');
    const workerHttp = libraries.find((lib) => lib.id === 'worker-http');
    expect(workerHttp).toBeDefined();

    const allLabels = workerHttp!.sections.flatMap((s) => s.items.map((i) => i.label));
    expect(allLabels).toContain('Realtime Clients');
  });
});
