import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { injectAxe, getViolations } from 'axe-playwright';
import App from './App';

test('check for accessibility violations', 
  async ({ mount, page }) => {
    // 1. Mount your React component
    await mount(<App />);

    // 2. Wait for AG Grid to load
    await page.waitForSelector('.ag-root');
    await page.waitForSelector(
      '.ag-overlay-loading-center', 
      { state: 'detached' }
    );

    // 3. Inject Axe on the page
    await injectAxe(page);

    // 4. Run the accessibility check on the grid
    const violations = await getViolations(page, '.ag-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    } as any);

    // 5. Check for violations
    expect(violations.length).toBe(0);
  }
);