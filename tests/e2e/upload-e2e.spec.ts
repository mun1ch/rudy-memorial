import { test, expect } from '@playwright/test';

const FILE_PATH = '/Users/aaugsbur/Downloads/Coatepeque-Lake-Wedding-El-Salvador-Daniela&Alex-306-R62_8256.jpg';

// Runs against the dev server started via Makefile (http://localhost:6464)
// Ensure the server is up before running: make start

test('upload provided file via UI and capture logs', async ({ page }) => {
  page.on('console', msg => {
    // eslint-disable-next-line no-console
    console.log(`[browser:${msg.type()}]`, msg.text());
  });

  await page.goto('http://localhost:6464/memories/photo');

  const fileInput = page.locator('input[type="file"][name="photo"]');
  await expect(fileInput).toBeVisible();

  await fileInput.setInputFiles(FILE_PATH);

  // Fill optional fields for completeness
  await page.locator('textarea[name="caption"]').fill('E2E upload test');
  await page.locator('input[name="name"]').fill('Playwright');

  await page.getByRole('button', { name: /upload/i }).click();

  // Wait for either success or error alert text
  const success = page.locator('text=/uploaded successfully/i');
  const error = page.locator('text=/All uploads failed|failed to upload/i');

  const outcome = await Promise.race([
    success.first().waitFor({ state: 'visible', timeout: 30000 }).then(() => 'success').catch(() => null),
    error.first().waitFor({ state: 'visible', timeout: 30000 }).then(() => 'error').catch(() => null),
  ]);

  // eslint-disable-next-line no-console
  console.log('Outcome:', outcome || 'timeout');

  // Assert we at least got an outcome (for diagnostics)
  expect(outcome).not.toBeNull();
});
