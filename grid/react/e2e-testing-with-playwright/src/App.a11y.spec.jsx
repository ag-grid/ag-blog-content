import { test, expect } from '@playwright/experimental-ct-react';
import { injectAxe, checkA11y } from 'axe-playwright';
import App from './App';

test.describe('Accessibility checks for App', () => {
  test('should have no automatically detectable accessibility violations', async ({ mount, page }) => {
    // 1. Mount your React component
    await mount(<App />);

    // 2. Wait for AG Grid to load
    await page.waitForSelector('.ag-root');

    // 3. Inject Axe on the page
    await injectAxe(page);

    // 4. Run the accessibility check on the grid
    // Note: This is checking accessibility violation for the grid portion of the page
    await checkA11y(page, '.ag-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});