import { test, expect } from '@playwright/test';

test.describe('CreatorOS End-to-End System Smoke Tests', () => {
  test('should simulate user authentication, onboarding, and full video generation flow', async ({ page }) => {
    // Keep external AI services deterministic. The E2E test verifies CreatorOS's
    // workflow/UI; it does not depend on live Gemini generation.
    await page.route('**/api/onboarding/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Perfect. I have enough information to build your channel style.',
          isComplete: true,
          summary: {
            niche: 'AI tools and technology',
            audience: 'Beginner content creators',
            vibe: 'Friendly and encouraging',
          },
        }),
      });
    });

    await page.route('**/api/onboarding/generate-brand', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'CreatorOS E2E Test Brand',
          tagline: 'Simple AI tools for creators.',
          archetype: 'The Guide',
          personality: 'friendly, clear, helpful',
          colors: {
            primary: '#111111',
            secondary: '#ffffff',
            accent: '#6366f1',
            background: '#f8fafc',
          },
          typography: { heading: 'Inter', body: 'Inter' },
          visual_style: 'Clean, modern, beginner-friendly visuals.',
          thumbnail_style: 'Bold text with a simple high-contrast layout.',
          content_hooks: [
            'Here is the easiest way to use this AI tool.',
            'Most beginners miss this simple AI trick.',
            'Let me show you how this works in under a minute.',
          ],
          catchphrases: [
            'Keep creating.',
            'Make it simple.',
          ],
        }),
      });
    });

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
            : {
                done: true,
                progressPercentage: 100,
                data: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAMWbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAA+gAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAkF0cmFrAAAAXHRraWQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAIAAAACAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPoAAAAAAABAAAAAAG5bWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAAAQABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABZG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAASRzdGJsAAAAwHN0c2QAAAAAAAAAAQAAALBhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAIAAgBIAAAASAAAAAAAAAABFUxhdmM2MS4xOS4xMDEgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAANmF2Y0MBZAAK/+EAGWdkAAqs2V+IiMBEAAADAAQAAAMACDxIllgBAAZo6+PLIsD9+PgAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAFigAAAAAAAAAGHN0dHMAAAAAAAAAAQAAAAEAAEAAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAsUAAAABAAAAFHN0Y28AAAAAAAAAAQAAA0YAAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAAJKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYxLjcuMTAzAAAACGZyZWUAAALNbWRhdAAAAq0GBf//qdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNjQgcjMxMDggMzFlMTlmOSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMjMgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz0xIGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0xIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWRf dGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9MjUwIGtleWludF9taW49MSBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBxYTE6MS4wMCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAEGWIhAAV//73ye/Apuvb34E='
              },
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

    // Build a deterministic test Brand Identity instead of skipping onboarding.
    // ContentStudio requires a complete brand before it renders the editor.
    const beginOnboarding = page.locator('button:has-text("Let\'s Begin!")');
    try {
      await beginOnboarding.waitFor({ state: 'visible', timeout: 5000 });
      await beginOnboarding.click();

      const onboardingInput = page.locator('input[placeholder="Type your response here..."]');
      await expect(onboardingInput).toBeVisible();
      await onboardingInput.fill('AI tools and technology for beginner content creators');
      await onboardingInput.press('Enter');

      await expect(page.locator('text=Your Profile is Ready!')).toBeVisible({ timeout: 10000 });
      await page.locator('button:has-text("Build My Channel Style")').click();
      await expect(page.locator('text=Architecting Your Channel Style')).toBeVisible();
      await expect(page.locator('text=Architecting Your Channel Style')).toBeHidden({ timeout: 10000 });
    } catch {
      // If onboarding is already complete for this test account, continue.
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
