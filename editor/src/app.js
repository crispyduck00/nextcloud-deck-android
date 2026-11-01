// SPDX-License-Identifier: GPL-3.0-or-later
import { createEditor, DescriptionDocument } from './document.js';

const $ = id => document.getElementById(id);
let model;
let sourceMode = false;
let initialized = false;
let labels = {
  visual: 'Visual', source: 'Markdown', checklist: 'Checklist', bullet: 'Bullet list',
  ordered: 'Numbered list', bold: 'Bold', italic: 'Italic', strike: 'Strikethrough',
  heading: 'Heading', link: 'Link', indent: 'Indent', outdent: 'Outdent', undo: 'Undo',
  redo: 'Redo', cancel: 'Cancel', apply: 'Apply', removeLink: 'Remove link',
  unsupported: 'This description contains formatting that cannot be edited visually without changes. Use Markdown mode to preserve it.',
  invalidLink: 'Use an https, http or mailto link.',
};

function bridge(method, ...args) {
  window.DeckBridge?.[method]?.(...args);
}
function currentMarkdown() {
  return sourceMode ? $('markdown').value : model.getMarkdown();
}
function changed() {
  if (initialized) bridge('onDraft', currentMarkdown(), sourceMode);
  updateToolbar();
}
const editor = createEditor($('editor'), changed);
editor.on('selectionUpdate', updateToolbar);

function updateToolbar() {
  const active = {
    task: editor.isActive('taskList'), bullet: editor.isActive('bulletList'),
    ordered: editor.isActive('orderedList'), bold: editor.isActive('bold'),
    italic: editor.isActive('italic'), strike: editor.isActive('strike'),
    heading: editor.isActive('heading'), link: editor.isActive('link'),
  };
  for (const button of document.querySelectorAll('[data-command]')) {
    button.setAttribute('aria-pressed', String(!!active[button.dataset.command]));
    if (button.dataset.command === 'undo') button.disabled = !editor.can().undo();
    if (button.dataset.command === 'redo') button.disabled = !editor.can().redo();
  }
}

function showMode(source) {
  sourceMode = source;
  $('markdown').hidden = !source;
  $('editor').hidden = source;
  $('toolbar').hidden = source;
  $('visual').setAttribute('aria-pressed', String(!source));
  $('source').setAttribute('aria-pressed', String(source));
  $('link-form').hidden = true;
}

function setMode(source) {
  if (source === sourceMode) return;
  const markdown = currentMarkdown();
  if (source) {
    $('markdown').value = markdown;
    $('notice').hidden = true;
  } else if (!model.load(markdown)) {
    $('notice').textContent = labels.unsupported;
    $('notice').hidden = false;
    return;
  } else {
    $('notice').hidden = true;
  }
  showMode(source);
  changed();
}

$('source').addEventListener('click', () => setMode(true));
$('visual').addEventListener('click', () => setMode(false));
$('markdown').addEventListener('input', changed);

function command(name) {
  // Tiptap's focus command restores a selection on the next animation frame.
  // Fast typing after a toolbar tap can otherwise race that stale selection.
  editor.view.focus();
  const chain = editor.chain();
  switch (name) {
    case 'task': chain.toggleTaskList().run(); break;
    case 'bullet': chain.toggleBulletList().run(); break;
    case 'ordered': chain.toggleOrderedList().run(); break;
    case 'bold': chain.toggleBold().run(); break;
    case 'italic': chain.toggleItalic().run(); break;
    case 'strike': chain.toggleStrike().run(); break;
    case 'heading': chain.toggleHeading({ level: 2 }).run(); break;
    case 'indent': chain.sinkListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem').run(); break;
    case 'outdent': chain.liftListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem').run(); break;
    case 'undo': chain.undo().run(); break;
    case 'redo': chain.redo().run(); break;
    case 'link':
      $('link-url').value = editor.getAttributes('link').href || '';
      $('link-error').hidden = true;
      $('link-form').hidden = false;
      $('link-url').focus();
      break;
  }
  updateToolbar();
}
for (const button of document.querySelectorAll('[data-command]')) {
  // Keep the selection and keyboard when tapping formatting controls.
  button.addEventListener('pointerdown', event => event.preventDefault());
  button.addEventListener('click', () => command(button.dataset.command));
}
$('link-cancel').addEventListener('click', () => { $('link-form').hidden = true; editor.view.focus(); });
$('link-remove').addEventListener('click', () => {
  editor.view.focus();
  editor.chain().extendMarkRange('link').unsetLink().run();
  $('link-form').hidden = true;
});
$('link-form').addEventListener('submit', event => {
  event.preventDefault();
  const href = $('link-url').value.trim();
  if (!/^(https?:\/\/|mailto:)/i.test(href)) {
    $('link-error').textContent = labels.invalidLink;
    $('link-error').hidden = false;
    return;
  }
  editor.view.focus();
  const chain = editor.chain().extendMarkRange('link');
  if (editor.state.selection.empty && !editor.isActive('link')) {
    chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
  } else {
    chain.setLink({ href }).run();
  }
  $('link-form').hidden = true;
});

// No navigation or remote resources are needed for editing descriptions.
document.addEventListener('click', event => {
  if (event.target.closest('a')) event.preventDefault();
});

window.DeckEditor = Object.freeze({
  initialize(options) {
    initialized = false;
    labels = { ...labels, ...options.labels };
    document.documentElement.lang = options.language || 'en';
    document.documentElement.dir = options.direction || 'ltr';
    for (const el of document.querySelectorAll('[data-label]')) {
      el.textContent = labels[el.dataset.label];
    }
    for (const el of document.querySelectorAll('[data-title]')) {
      el.setAttribute('aria-label', labels[el.dataset.title]);
      el.title = labels[el.dataset.title];
    }
    editor.view.dom.setAttribute('aria-label', options.descriptionLabel || 'Description');
    model = new DescriptionDocument(editor, options.markdown || '');
    $('markdown').value = options.markdown || '';
    showMode(!!options.sourceMode || !model.visual);
    $('notice').textContent = labels.unsupported;
    $('notice').hidden = model.visual;
    initialized = true;
    updateToolbar();
    bridge('onInitialized');
  },
  commit() {
    if (!initialized) return;
    // Blur commits any pending IME composition before serializing the document.
    document.activeElement?.blur();
    bridge('onApply', currentMarkdown());
  },
  close() {
    if (!initialized) return;
    document.activeElement?.blur();
    bridge('onClose', currentMarkdown(), sourceMode);
  },
});
window.addEventListener('error', () => bridge('onError'));
window.addEventListener('unhandledrejection', () => bridge('onError'));
bridge('onReady');
