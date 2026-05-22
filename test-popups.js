const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });

  console.log('Page loaded. Clicking random popup button...');
  // The random popup button is the one with the dice icon. Or we can just evaluate the function.

  await page.evaluate(() => {
    // try to find the button or just call the component method if possible
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Random City'),
    );
    if (btn) btn.click();
    else console.log('Random City button not found');
  });

  await page.waitForTimeout(2000);

  console.log('Clicking on map center...');
  await page.mouse.click(400, 300); // Click somewhere in the middle of the map

  await page.waitForTimeout(2000);

  await browser.close();
})();
