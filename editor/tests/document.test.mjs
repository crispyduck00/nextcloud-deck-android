// SPDX-License-Identifier: GPL-3.0-or-later
import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createEditor, DescriptionDocument, canEditVisually } from '../src/document.js';

let dom;
let editors = [];
before(() => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  for (const name of ['window', 'document', 'navigator', 'Node', 'HTMLElement', 'Element', 'DOMParser', 'MutationObserver', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
    Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
  }
});
afterEach(() => { editors.forEach(editor => editor.destroy()); editors = []; });
after(() => dom.window.close());
function open(markdown) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const editor = createEditor(element);
  editors.push(editor);
  const model = new DescriptionDocument(editor, markdown);
  return { editor, model };
}

const fixtures = {
  empty: '',
  plain: 'Some text with äöü ß and 😀.\nA second line.\n',
  headings: '# Heading\n\n## Second\n\n### Third\n\nBody',
  emphasis: '**bold** and _italic_ and ~~strike~~ and `code`',
  bullets: '- First\n- Second\n  - Nested\n',
  ordered: '3. First\n4. Second\n',
  checklist: '- [ ] Buy cells\n- [x] Test charger\n',
  nestedChecklist: '- [ ] Parent\n  - [x] Child\n  - [ ] Another\n- [ ] Next',
  links: '[A link](https://example.org/a?q=1&b=2 "Title") and <https://nextcloud.com>',
  attachment: '[📎 file.pdf](https://cloud.example/apps/deck/cards/5/attachment/17)',
  image: '![Battery](https://cloud.example/preview?fileId=5 "Image title")',
  quote: '> A quote\n>\n> Another paragraph',
  code: '```java\nif (a < b) {\n  run();\n}\n```',
  hardBreak: 'Line 1  \nLine 2',
  table: '| Name | Done |\n| --- | --- |\n| One | Yes |\n',
  literal: 'Mentions @andi, [[Wiki links]], $x$ and a literal \\[x\\].',
};
for (const [name, markdown] of Object.entries(fixtures)) {
  test(`${name}: visually editable and untouched text stays byte-for-byte identical`, () => {
    const { editor, model } = open(markdown);
    assert.equal(model.visual, true, `Unsupported fixture: ${name}`);
    assert.equal(model.getMarkdown(), markdown);
    // Mode switches/imports must not normalize the original string.
    assert.equal(model.load(model.getMarkdown()), true);
    assert.equal(model.getMarkdown(), markdown);
    assert.equal(editor.can().undo(), false);
  });
}

for (const markdown of [
  '<!-- keep this comment -->\n\nText',
  '<details><summary>Details</summary>Hidden text</details>',
  'An <span class="special">important</span> word',
  '<a href="/attachment"><img src="/preview" alt="Photo" /></a>',
  '<script>window.DeckBridge.onApply("bad")</script>',
  '[Footnote][^1]\n\n[^1]: Footnote body',
]) {
  test(`unsupported markup is retained in source: ${markdown.slice(0, 35)}`, () => {
    const { model } = open(markdown);
    assert.equal(model.visual, false);
    assert.equal(model.getMarkdown(), markdown);
  });
}

test('a checkbox toggles in the visual document and persists as Markdown', () => {
  const { editor, model } = open('- [ ] First\n- [x] Second');
  let taskPosition;
  editor.state.doc.descendants((node, pos) => {
    if (taskPosition === undefined && node.type.name === 'taskItem') taskPosition = pos;
  });
  editor.view.dispatch(editor.state.tr.setNodeMarkup(taskPosition, undefined, { checked: true }));
  assert.match(model.getMarkdown(), /- \[x\] First/);
  assert.match(model.getMarkdown(), /- \[x\] Second/);
});

test('checklist command creates a task without entering Markdown syntax', () => {
  const { editor, model } = open('Buy cells');
  editor.commands.setTextSelection(2);
  editor.commands.toggleTaskList();
  assert.match(model.getMarkdown(), /- \[ \] Buy cells/);
});

test('bold command and undo restore the exact original Markdown', () => {
  const original = 'An _unusual_ spelling.\n';
  const { editor, model } = open(original);
  editor.commands.setTextSelection({ from: 1, to: 3 });
  editor.commands.toggleBold();
  assert.notEqual(model.getMarkdown(), original);
  editor.commands.undo();
  assert.equal(model.getMarkdown(), original);
});

test('loading another document resets undo history', () => {
  const { editor, model } = open('First card');
  editor.commands.insertContent('changed');
  model.load('Second card');
  assert.equal(editor.commands.undo(), false);
  assert.equal(model.getMarkdown(), 'Second card');
});

test('editing text preserves nested tasks and attachment targets', () => {
  const { editor, model } = open('- [ ] Parent\n  - [x] Child\n\n[File](https://cloud.example/f/42)');
  assert.equal(model.visual, true);
  editor.commands.setTextSelection(3);
  editor.commands.insertContent('New ');
  const markdown = model.getMarkdown();
  assert.match(markdown, /New Parent/);
  assert.match(markdown, /\[x\] Child/);
  assert.match(markdown, /https:\/\/cloud.example\/f\/42/);
  assert.equal(canEditVisually(markdown, editor), true);
});

test('an image never creates a network-loading image element', () => {
  const { editor } = open(fixtures.image);
  assert.equal(editor.view.dom.querySelectorAll('img').length, 0);
  assert.match(editor.view.dom.textContent, /Battery/);
});
