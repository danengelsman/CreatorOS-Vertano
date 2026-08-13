import { test, expect } from '@playwright/test';

test.describe('CreatorOS End-to-End System Smoke Tests', () => {
  test('should simulate user authentication, onboarding, and full video generation flow', async ({ page }) => {
    // Keep Gemini calls inside the E2E test deterministic. We test CreatorOS's
    // workflow/UI here, not Google's live video service.
    await page.route('**/api/gemini/generate-video', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ operationName: 'mock-operation-e2e-123' }),
      });
    });

    let statusCheckCount = 0;
    await page.route('**/api/gemini/video-status', async route => {
      statusCheckCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          statusCheckCount < 3
            ? { done: false, progressPercentage: statusCheckCount * 40, data: null }
            : { done: true, progressPercentage: 100, data: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
        ),
      });
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/CreatorOS/i);
    await expect(page.locator('h1')).toBeVisible();

    const getStartedButton = page.locator('button:has-text("Get Started")');
    if (await getStartedButton.count() > 0) await getStartedButton.first().click();
    else await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);

    const testEmail = `smoke-test-${Date.now()}@creatoros.co`;
    const testPassword = 'SmokePassword123!';
    const emailInput = page.locator('input[placeholder="Email Address"]');
    const passwordInput = page.locator('input[placeholder="Password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    const toggleButton = page.locator('button:has-text("Sign Up")');
    if (await toggleButton.count() > 0) await toggleButton.first().click();
    await page.locator('button[type="submit"]').click();

    try {
      const errorDiv = page.locator('div:has-text("auth/")');
      if (await errorDiv.count() > 0) {
        const signInToggle = page.locator('button:has-text("Sign In")');
        if (await signInToggle.count() > 0) {
          await signInToggle.first().click();
          await emailInput.fill(testEmail);
          await passwordInput.fill(testPassword);
          await page.locator('button[type="submit"]').click();
        }
      }
    } catch {
      // Ignore if authentication completed without an inline auth error.
    }

    const skipOnboarding = page.locator('button:has-text("Set up manually later")');
    try {
      await skipOnboarding.waitFor({ state: 'visible', timeout: 5000 });
      await skipOnboarding.click();
    } catch {
      console.log('Onboarding step did not block or was not displayed, continuing.');
    }

    const menuButton = page.locator('button:has-text("CreatorOS")').or(page.locator('header button').first());
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const createNavItem = page.locator('button:has-text("Create")').first();
    await expect(createNavItem).toBeVisible();
    await createNavItem.click();

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
