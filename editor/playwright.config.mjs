// SPDX-License-Identifier: GPL-3.0-or-later
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  fullyParallel: false,
  workers: 1,
  use: {
    viewport: { width: 412, height: 820 },
    hasTouch: true,
    launchOptions: process.env.EDITOR_CHROMIUM_PATH ? {
      executablePath: process.env.EDITOR_CHROMIUM_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    } : {},
  },
});
