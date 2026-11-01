// SPDX-License-Identifier: GPL-3.0-or-later
import { build } from 'esbuild';
import { mkdir, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(root, '../app/src/main/assets/visual-editor');
await mkdir(assets, { recursive: true });
await build({
  entryPoints: [path.join(root, 'src/app.js')],
  outfile: path.join(assets, 'editor.js'),
  bundle: true, minify: true, format: 'iife', target: ['chrome80'],
  legalComments: 'eof', charset: 'utf8',
});
await copyFile(path.join(root, 'src/index.html'), path.join(assets, 'index.html'));
await copyFile(path.join(root, 'src/editor.css'), path.join(assets, 'editor.css'));

// Ship attribution and complete license texts alongside the bundled software.
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const notices = ['Third-party software bundled in the Deck visual editor.\n'];
for (const [name, info] of Object.entries(lock.packages).sort()) {
  if (!name || info.dev) continue;
  const folder = path.join(root, name);
  const files = await readdir(folder);
  const license = files.find(file => /^licen[cs]e(\.md|\.txt)?$/i.test(file));
  notices.push(`\n=== ${name.replace('node_modules/', '')} ${info.version} (${info.license || 'see below'}) ===\n`);
  if (!license) throw new Error(`Missing license: ${name}`);
  notices.push(await readFile(path.join(folder, license), 'utf8'));
}
await writeFile(path.join(assets, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n'));
