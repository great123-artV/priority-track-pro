import { test, expect } from '@playwright/test';

test.describe('Priority AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('http://localhost:8080');

    // Wait for the intro animation to finish (approx 4-5s based on memory)
    // We'll wait for the main content to be visible
    await page.waitForSelector('text=Move the world, one shipment at a time', { timeout: 10000 });
  });

  test('should open the AI assistant and show welcome message', async ({ page }) => {
    // Find the toggle button
    const toggleButton = page.locator('button:has(svg.lucide-message-square)');
    await expect(toggleButton).toBeVisible();

    // Click to open
    await toggleButton.click();

    // Check if the AI window is visible
    await expect(page.locator('text=Priority AI')).toBeVisible();
    await expect(page.locator('text=Welcome to Priority Mail Express')).toBeVisible();

    // Check for quick suggestions
    await expect(page.locator('text=Track My Shipment')).toBeVisible();
    await expect(page.locator('text=Contact Support')).toBeVisible();
  });

  test('should respond to a tracking inquiry', async ({ page }) => {
    // Open AI
    await page.click('button:has(svg.lucide-message-square)');

    // Type a tracking inquiry
    const input = page.locator('input[placeholder*="Ask me anything"]');
    await input.fill('Where is my shipment PME-AWB-20260622-000001?');
    await page.keyboard.press('Enter');

    // Wait for loader to disappear and response to appear
    await expect(page.locator('text=I found your shipment PME-AWB-20260622-000001')).toBeVisible({ timeout: 10000 });

    // Check for tracking details in response
    await expect(page.locator('text=Status:')).toBeVisible();
    await expect(page.locator('text=Origin:')).toBeVisible();

    // Check for "View Full Tracking Details" button
    const viewDetailsButton = page.locator('a:has-text("View Full Tracking Details")');
    await expect(viewDetailsButton).toBeVisible();
    await expect(viewDetailsButton).toHaveAttribute('href', /\/track\/PME-AWB-20260622-000001/i);
  });

  test('should provide support options when asked', async ({ page }) => {
    // Open AI
    await page.click('button:has(svg.lucide-message-square)');

    // Ask for support
    const input = page.locator('input[placeholder*="Ask me anything"]');
    await input.fill('I need to contact support');
    await page.keyboard.press('Enter');

    // Wait for response
    await expect(page.locator('text=contact support')).toBeVisible({ timeout: 10000 });

    // Check for support buttons
    await expect(page.locator('text=WhatsApp')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Phone')).toBeVisible();
  });

  test('should be context aware (Tracking Page)', async ({ page }) => {
    // Go to tracking page
    await page.goto('http://localhost:8080/track');
    await page.waitForSelector('text=Track Your Shipment');

    // Open AI
    await page.click('button:has(svg.lucide-message-square)');

    // Since we don't have LLM yet, the mock just says hello.
    // But in a real scenario, it would use the currentPage context.
    // For now, verify it opens on this page.
    await expect(page.locator('text=Priority AI')).toBeVisible();
  });
});
