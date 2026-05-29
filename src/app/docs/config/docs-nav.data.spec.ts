import { getNavLibrariesForVersion } from './docs-nav.data';

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

    // Check that none of the items in browser-web-apis are marked as experimental
    const hasExperimental = browserWebApis!.sections.some((section) =>
      section.items.some((item) => (item as any).experimental),
    );
    expect(hasExperimental).toBe(false);
  });
});
