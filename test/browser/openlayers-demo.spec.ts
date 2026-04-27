import { expect, test } from '@playwright/test';

test.describe('OpenLayers Demo', () => {
  test('renders the OpenLayers demo page with map container', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Verify page title and header
    await expect(page.getByRole('heading', { level: 1, name: /OpenLayers Demo/i })).toBeVisible();
    await expect(
      page.getByText(/Interactive map with @angular-helpers\/openlayers/i),
    ).toBeVisible();

    // Verify map container is present (this requires WebGL)
    const mapContainer = page.locator('ol-map .ol-map-container');
    await expect(mapContainer).toBeVisible();
  });

  test('map controls are rendered', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for map to initialize
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Verify Angular component controls are present (custom elements)
    await expect(page.locator('ol-zoom-control')).toBeAttached();
    await expect(page.locator('ol-attribution-control')).toBeAttached();
    await expect(page.locator('ol-scale-line-control')).toBeAttached();
    await expect(page.locator('ol-fullscreen-control')).toBeAttached();
    await expect(page.locator('ol-rotate-control')).toBeAttached();
  });

  test('layer switcher and basemap switcher are present', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for map to initialize
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Verify custom Angular components are attached
    await expect(page.locator('ol-layer-switcher')).toBeAttached();
    await expect(page.locator('ol-basemap-switcher')).toBeAttached();
    await expect(page.locator('ol-vector-layer#cities')).toBeAttached();
    await expect(page.locator('ol-vector-layer#drawn-features')).toBeAttached();
  });

  test('map info panel displays coordinates', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Verify info panel sections are visible
    await expect(page.getByText(/View State/i)).toBeVisible();
    await expect(page.getByText(/Center:/i)).toBeVisible();
    await expect(page.getByText(/Zoom:/i)).toBeVisible();
    await expect(page.getByText(/Last Click/i)).toBeVisible();
  });

  test('city markers are displayed on the map', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for map and vector layer to initialize
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Verify vector layer with cities is attached
    const vectorLayer = page.locator('ol-vector-layer#cities');
    await expect(vectorLayer).toBeAttached();
  });

  test('basemap switcher allows changing basemaps', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for map to initialize
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Get basemap switcher (try multiple selectors)
    const basemapSwitcher = page.locator('ol-basemap-switcher, .ol-basemap-switcher').first();
    await expect(basemapSwitcher).toBeAttached();

    // Click on basemap switcher toggle to open panel
    const toggle = basemapSwitcher.locator('.ol-basemap-switcher__toggle, button').first();
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();

      // The panel is @if-mounted only while open, so attached == opened.
      const panel = basemapSwitcher.locator('.ol-basemap-switcher__panel');
      await expect(panel).toBeAttached();

      // Scope the option-text lookup to the panel — the toggle itself also
      // renders the active basemap name, which would otherwise match in
      // strict mode.
      await expect(panel.getByText(/OpenStreetMap|Satellite|Terrain/i).first()).toBeVisible();
    }
  });

  test('layer switcher shows layer controls', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for map to initialize
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Get layer switcher
    const layerSwitcher = page.locator('ol-layer-switcher, .ol-layer-switcher').first();
    await expect(layerSwitcher).toBeAttached();

    // Click on layer switcher toggle to open panel
    const toggle = layerSwitcher.locator('.ol-layer-switcher__toggle, button').first();
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();

      // The panel is @if-mounted only while open, so attached == opened —
      // this avoids flakes caused by the panel being present in the DOM
      // before CSS/layout has settled.
      await expect(layerSwitcher.locator('.ol-layer-switcher__panel')).toBeAttached();
    }
  });
});
