// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const assets = fileURLToPath(new URL('../../app/src/main/assets/visual-editor/', import.meta.url));
async function open(page, markdown, options = {}) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.events = [];
    window.DeckBridge = Object.fromEntries(
      ['onReady', 'onInitialized', 'onDraft', 'onApply', 'onClose', 'onError']
        .map(name => [name, (...args) => window.events.push({ name, args })]),
    );
  });
  await page.route('https://deck-editor.invalid/**', async route => {
    const name = path.basename(new URL(route.request().url()).pathname);
    const file = name || 'index.html';
    const contentType = file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html';
    await route.fulfill({ body: await readFile(path.join(assets, file)), contentType });
  });
  await page.goto('https://deck-editor.invalid/index.html');
  await page.evaluate(options => window.DeckEditor.initialize(options), { markdown, ...options });
  expect(errors).toEqual([]);
  return errors;
}
async function apply(page) {
  await page.evaluate(() => window.DeckEditor.commit());
  return page.evaluate(() => window.events.findLast(event => event.name === 'onApply')?.args[0]);
}

test('checklist button, Enter continuation, checkbox toggling and Markdown export', async ({ page }) => {
  await open(page, '');
  await page.getByRole('button', { name: 'Checklist', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Description', exact: true });
  await editor.pressSequentially('Buy cells');
  await editor.press('Enter');
  await editor.pressSequentially('Test charger');
  await expect(page.locator('input[type=checkbox]')).toHaveCount(2);
  const checkbox = await page.locator('input[type=checkbox]').first().boundingBox();
  const text = await page.locator('li[data-type=taskItem] > div > p').first().boundingBox();
  expect(Math.abs((checkbox.y + checkbox.height / 2) - (text.y + text.height / 2))).toBeLessThan(16);
  await page.locator('input[type=checkbox]').first().check();
  const markdown = await apply(page);
  expect(markdown).toContain('- [x] Buy cells');
  expect(markdown).toContain('- [ ] Test charger');
});

test('switching modes and applying an unchanged description preserves exact bytes', async ({ page }) => {
  const original = '# Heading\n\n* [ ] First\n* [x] Second\n\nAn _italic_ word.\n';
  await open(page, original);
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(page.locator('#markdown')).toHaveValue(original);
  await page.getByRole('button', { name: 'Visual', exact: true }).click();
  expect(await apply(page)).toBe(original);
});

test('unsupported HTML opens as source and cannot execute bridge calls', async ({ page }) => {
  const original = '<script>window.DeckBridge.onApply("injected")</script>\n\n<!-- preserve -->';
  await open(page, original);
  await expect(page.locator('#markdown')).toBeVisible();
  await expect(page.locator('#notice')).toBeVisible();
  await page.getByRole('button', { name: 'Visual', exact: true }).click();
  await expect(page.locator('#markdown')).toHaveValue(original);
  expect(await page.evaluate(() => window.events.filter(event => event.name === 'onApply'))).toEqual([]);
  expect(await apply(page)).toBe(original);
});

test('source-only edits survive Apply and Close without normalizing', async ({ page }) => {
  await open(page, 'Original');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  const changed = '  Raw content\n\n<!-- deliberate HTML -->\n';
  await page.locator('#markdown').fill(changed);
  await page.evaluate(() => window.DeckEditor.close());
  expect(await page.evaluate(() => window.events.findLast(event => event.name === 'onClose').args)).toEqual([changed, true]);
  expect(await apply(page)).toBe(changed);
});

test('editing a nested checklist preserves nesting, completed states and attachments', async ({ page }) => {
  await open(page, '- [ ] Parent\n  - [x] Child\n\n[File](https://cloud.example/f/42)');
  await expect(page.locator('#editor')).toBeVisible();
  await page.locator('input[type=checkbox]').first().check();
  const markdown = await apply(page);
  expect(markdown).toMatch(/- \[x\] Parent\n\s+- \[x\] Child/);
  expect(markdown).toContain('https://cloud.example/f/42');
});

test('toolbar formatting and undo retain cursor selection and restore original text', async ({ page }) => {
  await open(page, 'Battery repair');
  const editor = page.getByRole('textbox', { name: 'Description', exact: true });
  await editor.click();
  await editor.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  expect(await apply(page)).toBe('**Battery repair**');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await apply(page)).toBe('Battery repair');
});

test('images are placeholders, links do not navigate, and no remote request is made', async ({ page }) => {
  const outgoing = [];
  page.on('request', request => {
    if (!request.url().startsWith('https://deck-editor.invalid/')) outgoing.push(request.url());
  });
  await open(page, '![Photo](https://private.example/image.jpg)\n\n[File](https://private.example/file)');
  await expect(page.locator('#editor img')).toHaveCount(0);
  await page.getByRole('link', { name: 'File' }).click();
  expect(page.url()).toBe('https://deck-editor.invalid/index.html');
  expect(outgoing).toEqual([]);
});

test('German labels, narrow viewport, and dark theme render without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await open(page, '## Akku prüfen\n\n- [ ] Spannung messen\n- [x] Ladegerät testen\n  - [ ] Stecker kontrollieren\n\n**Notiz:** Rücksprache mit dem Kunden.', {
    language: 'de', labels: { visual: 'Visuell', checklist: 'Checkliste' },
  });
  await expect(page.getByRole('button', { name: 'Checkliste', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(23, 25, 28)');
  if (process.env.EDITOR_SCREENSHOT_PATH) {
    await page.screenshot({ path: process.env.EDITOR_SCREENSHOT_PATH });
  }
});
