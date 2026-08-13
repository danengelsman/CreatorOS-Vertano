import { test, expect } from '@playwright/test';

test.describe('CreatorOS smoke tests', () => {
  test('authenticated user can generate Gemini video', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('button:has-text("Sign in")').first();
    if (await loginButton.count() > 0) {
      await loginButton.click();
    }

    const skipOnboarding = page.locator('button:has-text("Set up manually later")');
    try {
      await skipOnboarding.waitFor({ state: 'visible', timeout: 5000 });
      await skipOnboarding.click();
    } catch (e) {
      console.log('Onboarding step did not block or was not displayed, continuing.');
    }

    // Open the app menu and select the drawer's Create item. The bottom navigation
    // also contains a Create button, so an unscoped locator matches two elements.
    const menuButton = page.locator('button:has-text("CreatorOS")').or(page.locator('header button').first());
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const createNavItem = page.locator('button:has-text("Create")').first();
    await expect(createNavItem).toBeVisible();
    await createNavItem.click();

    // ContentStudio uses a single narrative textarea. Target the actual control
    // rather than coupling the E2E test to copy in its placeholder text.
    const scriptEditor = page.locator('textarea').first();
    await expect(scriptEditor).toBeVisible();
    await scriptEditor.fill('This is an automated E2E system check verifying Gemini Video generation, layout boundaries, and reactive workflows.');

    const advancedSettingsButton = page.locator('button[title="Advanced Settings"]');
    await expect(advancedSettingsButton).toBeVisible();
    await advancedSettingsButton.click();
    await expect(page.locator('label:has-text("Video Style")')).toBeVisible();

    const avatarStyleBtn = page.locator('button:has-text("AI Avatar")');
    if (await avatarStyleBtn.count() > 0) await avatarStyleBtn.first().click();

    const overlayInput = page.locator('input[placeholder*="flying text or captions"]');
    if (await overlayInput.count() > 0) await overlayInput.fill('CreatorOS E2E Test Suite');

    const backgroundInput = page.locator('input[placeholder*="Modern office, Cyberpunk city"]');
    if (await backgroundInput.count() > 0) await backgroundInput.fill('Ultra-minimalist digital agency setup');

    const generateBtn = page.locator('button:has-text("Generate Gemini")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    await expect(page.locator('span:has-text("Gemini Preview")')).toBeVisible();
    await expect(page.locator('video')).toBeVisible();
    console.log('E2E video generation completed and tested successfully!');
  });
});
