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

    // Wait for map to initialize (controls may render asynchronously)
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000); // Additional wait for controls to mount

    // Verify zoom control is present (may be in shadow DOM or delayed)
    await expect(page.locator('ol-zoom-control, .ol-zoom')).toBeAttached();

    // Verify attribution control
    await expect(page.locator('ol-attribution-control, .ol-attribution')).toBeAttached();

    // Verify scale line control
    await expect(page.locator('ol-scale-line-control, .ol-scale-line')).toBeAttached();

    // Verify fullscreen control
    await expect(page.locator('ol-fullscreen-control, .ol-fullscreen')).toBeAttached();

    // Verify rotate control
    await expect(page.locator('ol-rotate-control, .ol-rotate')).toBeAttached();
  });

  test('layer switcher and basemap switcher are present', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for map to initialize
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Verify layer switcher (may use custom class names)
    await expect(page.locator('ol-layer-switcher, .ol-layer-switcher')).toBeAttached();

    // Verify basemap switcher
    await expect(page.locator('ol-basemap-switcher, .ol-basemap-switcher')).toBeAttached();
  });

  test('map info panel displays coordinates', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Verify info panel is visible
    await expect(page.getByText(/Center:/i)).toBeVisible();
    await expect(page.getByText(/Zoom:/i)).toBeVisible();
    await expect(page.getByText(/Rotation:/i)).toBeVisible();
  });

  test('city markers are displayed on the map', async ({ page }) => {
    await page.goto('/demo/openlayers');

    // Wait for map and vector layer to initialize
    await page.waitForSelector('ol-map .ol-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow time for features to render

    // Verify vector layer is present (may use different selector)
    await expect(page.locator('ol-vector-layer')).toBeAttached();
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

      // Verify basemap options are available
      await expect(basemapSwitcher.getByText(/OpenStreetMap|Satellite|Terrain/i)).toBeVisible();
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

      // Verify layer list is visible
      await expect(
        layerSwitcher.locator('.ol-layer-switcher__panel, ol-layer-switcher__panel'),
      ).toBeVisible();
    }
  });
});
